CREATE OR REPLACE VIEW public.public_app_settings
WITH (security_invoker = true) AS
SELECT id, site_name, site_url, referral_percent, tidio_public_key,
       sendpulse_chat_id, sendpulse_embed_html, tawk_property_id, tawk_widget_id,
       announcement_enabled, announcement_title, announcement_message,
       announcement_link, announcement_link_label, announcement_version
FROM public.app_settings;

GRANT SELECT ON public.public_app_settings TO anon, authenticated;