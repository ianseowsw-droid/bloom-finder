import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/remove-background")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { image, mimeType } = (await request.json()) as {
          image: string;
          mimeType?: string;
        };
        if (!image) return new Response("Missing image", { status: 400 });

        const dataUrl = image.startsWith("data:")
          ? image
          : `data:${mimeType ?? "image/jpeg"};base64,${image}`;

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Isolate the main flower or plant subject from this photograph. Remove everything else and replace the background with a clean, solid pure white (#FFFFFF) backdrop. Keep the plant's natural colors, leaves, petals, and stem fully intact with crisp, clean edges. Frame the subject centered like a pressed botanical specimen on archival paper. Return only the edited image.",
                    },
                    { type: "image_url", image_url: { url: dataUrl } },
                  ],
                },
              ],
              modalities: ["image", "text"],
            }),
          },
        );

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Upstream error", { status: upstream.status });
        }

        const json = (await upstream.json()) as {
          data?: { b64_json?: string }[];
        };
        const b64 = json.data?.[0]?.b64_json;
        if (!b64) return new Response("No image returned", { status: 502 });

        return Response.json({ image: `data:image/png;base64,${b64}` });
      },
    },
  },
});
