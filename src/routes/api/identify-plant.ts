import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/identify-plant")({
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

        const prompt = `You are a botanist identifying a flower or plant from a photo.
Look closely and identify the species if you can.
Respond with ONLY a single JSON object — no markdown, no code fences, no extra text — matching exactly this shape:
{"identified": boolean, "commonName": string | null, "latinName": string | null, "confidence": number, "color": string | null, "habitat": string | null, "funFact": string | null}

Rules:
- "identified" is true only if you can confidently name the species or a close relative.
- "confidence" is 0-100, your confidence in the identification.
- "color" is the dominant flower/bloom color, one word (e.g. "Pink"), or null if not visible.
- "habitat" is your best guess at one of: Garden, Meadow, Forest, Roadside, Wetland, Indoor, or null.
- "funFact" is one short, interesting sentence about the plant, or null.
- If the photo does not clearly show a flower or plant, set "identified" to false and the other fields to null.
- Output raw JSON only, nothing else.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Upstream error", { status: upstream.status });
        }

        const json = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const raw = json.choices?.[0]?.message?.content;
        if (!raw) return new Response("No identification returned", { status: 502 });

        // Models sometimes wrap JSON in code fences despite instructions; strip if present.
        const cleaned = raw
          .trim()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "");

        let parsed: {
          identified?: boolean;
          commonName?: string | null;
          latinName?: string | null;
          confidence?: number;
          color?: string | null;
          habitat?: string | null;
          funFact?: string | null;
        };
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          return new Response("Could not parse identification", { status: 502 });
        }

        return Response.json({
          identified: Boolean(parsed.identified && parsed.commonName),
          commonName: parsed.commonName ?? null,
          latinName: parsed.latinName ?? null,
          confidence: typeof parsed.confidence === "number" ? Math.round(parsed.confidence) : 0,
          color: parsed.color ?? null,
          habitat: parsed.habitat ?? null,
          funFact: parsed.funFact ?? null,
        });
      },
    },
  },
});
