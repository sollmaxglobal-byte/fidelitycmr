import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Check, FileImage, ShieldCheck, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { sendEmail } from "@/lib/email-client";
import { notifyAdminOfRequest, requestName } from "@/lib/admin-request-notifications";
import { txRef } from "@/lib/format";
import { verifyDepositProof } from "@/lib/deposit-verify.functions";
import { formatXAF } from "@/lib/format";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  amount: z.coerce.number().min(1000),
  method: z.string().uuid(),
});

export const Route = createFileRoute("/deposit-proof")({
  validateSearch: (search) => searchSchema.parse(search),
  component: DepositProofPage,
});

type PaymentMethod = { id: string; label: string };

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 700_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function DepositProofPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { amount, method } = Route.useSearch();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("payment_methods")
      .select("id,label")
      .eq("id", method)
      .maybeSingle()
      .then(({ data }) => setPaymentMethod(data as PaymentMethod | null));
  }, [method]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function submitDeposit() {
    if (!user || !paymentMethod) return;
    if (!file) {
      toast.error(t("deposit.errNoFile"));
      return;
    }
    setBusy(true);
    try {
      const upload = await compressImage(file);
      const safeName = upload.name.replace(/[^\w.-]+/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, upload, {
          upsert: false,
          cacheControl: "3600",
        });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("deposits")
        .insert({
          user_id: user.id,
          amount,
          payment_method_id: method,
          proof_url: path,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;

      if (user.email) {
        sendEmail({
          to: user.email,
          template_key: "deposit_submitted",
          variables: {
            name: user.user_metadata?.full_name ?? "Investor",
            amount: String(amount),
            method: paymentMethod.label,
            transaction_id: txRef(data.id),
          },
        });
      }
      void notifyAdminOfRequest("deposit", {
        id: data.id,
        name: requestName(user),
        email: user.email ?? "Not provided",
        amount: formatXAF(amount),
        method: paymentMethod.label,
      });
      // Kick off automatic verification (reads the screenshot, matches the operator message).
      void verifyDepositProof({ data: { depositId: data.id } }).catch(() => {});

      toast.success(t("deposit.submitted"));
      navigate({ to: "/deposit-pending/$id", params: { id: data.id } });
    } catch (error) {
      const message = (error as Error).message || "Unable to submit deposit";
      toast.error(
        /fetch|network|load failed|timeout/i.test(message)
          ? "Upload failed. Check your connection and try again."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-28 md:pb-6">
      <header>
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-success">
          <ShieldCheck className="h-4 w-4" /> Payment confirmed · Step 3 of 3
        </div>
        <h1 className="font-display text-3xl text-primary">Upload payment proof</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a clear screenshot or photo showing your completed transfer.
        </p>
      </header>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div>
          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
            Payment summary
          </div>
          <div className="mt-1 text-sm font-medium text-foreground">
            {paymentMethod?.label ?? "Loading…"}
          </div>
        </div>
        <div className="text-right text-lg font-bold uppercase tabular-nums text-primary">
          {formatXAF(amount)}
        </div>
      </div>

      <label className="block cursor-pointer rounded-lg border-2 border-dashed border-border bg-card p-4 transition hover:border-primary">
        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Selected payment proof"
              className="mx-auto max-h-72 rounded-md object-contain"
            />
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-success">
              <Check className="h-4 w-4" /> {file?.name}
            </div>
          </div>
        ) : (
          <div className="flex min-h-52 flex-col items-center justify-center text-center">
            <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-7 w-7" />
            </span>
            <div className="font-semibold text-foreground">Select payment proof</div>
            <div className="mt-1 text-xs text-muted-foreground">
              JPG, PNG or a screenshot from your payment app
            </div>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="rounded-lg bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">
        <FileImage className="mr-1 inline h-4 w-4 text-primary" /> Ensure the amount, receiver and
        transaction reference are visible before submitting.
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-background/95 p-2 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-xl gap-2">
          <Button asChild variant="outline" className="h-10 flex-1">
            <Link to="/deposit-payment" search={{ amount, method }}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
          <Button
            onClick={submitDeposit}
            disabled={!file || busy || !paymentMethod}
            className="h-10 flex-[2] bg-primary text-primary-foreground"
          >
            {busy ? t("deposit.submitting") : t("deposit.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
