/** Server-only helper that translates an email template to French via Lovable AI. */
export async function translateEmailTemplate(subject: string, html: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You translate transactional email templates from English to French (Cameroon). " +
            "Keep ALL HTML markup, inline styles and {{variable}} placeholders exactly as they are. " +
            "Translate only human-readable text. Reply with strict JSON: " +
            '{"subject":"...","html":"..."} and nothing else.',
        },
        {
          role: "user",
          content: JSON.stringify({ subject, html }),
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned) as { subject: string; html: string };
  return { subject: parsed.subject, html: parsed.html };
}
