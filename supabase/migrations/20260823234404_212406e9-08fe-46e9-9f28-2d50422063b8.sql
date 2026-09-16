CREATE TABLE public.mm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text text NOT NULL,
  sender text,
  txn_id text,
  txn_id_norm text,
  amount numeric,
  payer_number text,
  received_at timestamptz NOT NULL DEFAULT now(),
  matched_deposit_id uuid REFERENCES public.deposits(id),
  matched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mm_messages TO authenticated;
GRANT ALL ON public.mm_messages TO service_role;
ALTER TABLE public.mm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read mm_messages" ON public.mm_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX mm_messages_txn_id_norm_key ON public.mm_messages (txn_id_norm) WHERE txn_id_norm IS NOT NULL;
CREATE INDEX mm_messages_received_at_idx ON public.mm_messages (received_at DESC);

ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS ocr_txn_id text,
  ADD COLUMN IF NOT EXISTS ocr_txn_id_norm text,
  ADD COLUMN IF NOT EXISTS ocr_amount numeric,
  ADD COLUMN IF NOT EXISTS ocr_payer text,
  ADD COLUMN IF NOT EXISTS ocr_raw jsonb,
  ADD COLUMN IF NOT EXISTS auto_note text,
  ADD COLUMN IF NOT EXISTS matched_message_id uuid REFERENCES public.mm_messages(id),
  ADD COLUMN IF NOT EXISTS auto_approved_at timestamptz;

CREATE INDEX IF NOT EXISTS deposits_ocr_txn_id_norm_idx ON public.deposits (ocr_txn_id_norm) WHERE ocr_txn_id_norm IS NOT NULL;

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS auto_approve_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_approve_max_amount numeric,
  ADD COLUMN IF NOT EXISTS mm_webhook_secret text;

CREATE OR REPLACE FUNCTION public.auto_approve_deposit(_deposit_id uuid, _message_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  d public.deposits%ROWTYPE;
  m public.mm_messages%ROWTYPE;
  cap numeric;
  enabled boolean;
BEGIN
  SELECT auto_approve_enabled, auto_approve_max_amount INTO enabled, cap FROM public.app_settings WHERE id = 1;
  IF COALESCE(enabled, true) = false THEN
    RETURN jsonb_build_object('approved', false, 'reason', 'Auto-approval disabled');
  END IF;

  SELECT * INTO d FROM public.deposits WHERE id = _deposit_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('approved', false, 'reason', 'Deposit not found'); END IF;
  IF d.status <> 'pending' THEN RETURN jsonb_build_object('approved', false, 'reason', 'Deposit already reviewed'); END IF;

  SELECT * INTO m FROM public.mm_messages WHERE id = _message_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('approved', false, 'reason', 'Message not found'); END IF;
  IF m.matched_deposit_id IS NOT NULL AND m.matched_deposit_id <> _deposit_id THEN
    RETURN jsonb_build_object('approved', false, 'reason', 'Message already used');
  END IF;

  IF cap IS NOT NULL AND d.amount > cap THEN
    RETURN jsonb_build_object('approved', false, 'reason', 'Above auto-approval limit');
  END IF;

  IF m.amount IS NULL OR trunc(m.amount) <> trunc(d.amount) THEN
    RETURN jsonb_build_object('approved', false, 'reason', 'Amount mismatch');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.deposits x
    WHERE x.id <> d.id AND x.ocr_txn_id_norm IS NOT NULL
      AND x.ocr_txn_id_norm = m.txn_id_norm AND x.status = 'approved'
  ) THEN
    RETURN jsonb_build_object('approved', false, 'reason', 'Transaction ID already used');
  END IF;

  UPDATE public.deposits
    SET status = 'approved',
        reviewed_at = now(),
        auto_approved_at = now(),
        matched_message_id = m.id,
        auto_note = 'Auto-approved: transaction ID and amount matched operator message'
    WHERE id = d.id;

  UPDATE public.mm_messages SET matched_deposit_id = d.id, matched_at = now() WHERE id = m.id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET balance = balance + d.amount WHERE id = d.user_id;

  INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
  VALUES (d.user_id, 'deposit', d.amount, 'Deposit auto-approved', d.id);

  RETURN jsonb_build_object('approved', true, 'reason', 'Approved');
END;
$$;

REVOKE ALL ON FUNCTION public.auto_approve_deposit(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_approve_deposit(uuid, uuid) TO service_role;