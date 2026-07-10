// Shared client for calling the /api/identify-plant route.
// Used by both the web app (src/routes/capture.tsx, same-origin, apiBase="")
// and the native app (src/mobile/App.tsx, which has no server of its own and
// must call an absolute URL of the deployed web app via VITE_API_BASE_URL).

export type Identification = {
  identified: boolean;
  commonName: string | null;
  latinName: string | null;
  confidence: number;
  color: string | null;
  habitat: string | null;
  funFact: string | null;
};

export async function identifyPlant(dataUrl: string, apiBase = ""): Promise<Identification | null> {
  try {
    const res = await fetch(`${apiBase}/api/identify-plant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl }),
    });
    if (!res.ok) throw new Error("Identification failed");
    return (await res.json()) as Identification;
  } catch {
    return null;
  }
}
