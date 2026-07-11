import { createFileRoute } from "@tanstack/react-router";

// Calls Google's Gemini API directly using your own GEMINI_API_KEY.
// Get a key at https://aistudio.google.com/apikey
const MODEL = "gemini-3.1-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const Route = createFileRoute("/api/remove-background")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.GEMINI_API_KEY;
        if (!key) return new Response("Missing GEMINI_API_KEY", { status: 500 });

        const { image, mimeType } = (await request.json()) as {
          image: string;
          mimeType?: string;
        };
        if (!image) return new Response("Missing image", { status: 400 });

        // Gemini wants raw base64 plus a separate mime type, not a data: URL.
        const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        const base64Data = match ? match[2] : image;
        const resolvedMimeType = match ? match[1] : (mimeType ?? "image/jpeg");

        const prompt =
          "Isolate the main flower or plant subject from this photograph. Remove everything else and replace the background with a clean, solid pure white (#FFFFFF) backdrop. Keep the plant's natural colors, leaves, petals, and stem fully intact with crisp, clean edges. Frame the subject centered like a pressed botanical specimen on archival paper. Return only the edited image.";

        const upstream = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "x-goog-api-key": key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: resolvedMimeType, data: base64Data } },
                ],
              },
            ],
            // Image-only output isn't supported by this model — TEXT must be
            // requested alongside IMAGE, even though we only use the image part.
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Upstream error", { status: upstream.status });
        }

        const json = (await upstream.json()) as {
          candidates?: {
            content?: {
              parts?: {
                text?: string;
                inlineData?: { mimeType?: string; data?: string };
                inline_data?: { mime_type?: string; data?: string };
              }[];
            };
          }[];
        };

        const parts = json.candidates?.[0]?.content?.parts ?? [];
        const imagePart = parts.find((p) => p.inlineData?.data ?? p.inline_data?.data);
        const b64 = imagePart?.inlineData?.data ?? imagePart?.inline_data?.data;
        const outMime =
          imagePart?.inlineData?.mimeType ?? imagePart?.inline_data?.mime_type ?? "image/png";

        if (!b64) return new Response("No image returned", { status: 502 });

        return Response.json({ image: `data:${outMime};base64,${b64}` });
      },
    },
  },
});
