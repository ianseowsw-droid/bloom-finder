import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useRef, useState } from "react";
import { Camera, Crosshair, MapPin, Sparkles, X, ImagePlus, RotateCcw } from "lucide-react";
import { addSpecimen } from "@/lib/collection";
import { formatCoords, getCurrentFieldLocation, type FieldLocation } from "@/lib/location";
import { isSupabaseConfigured } from "@/lib/supabase";
import { consumeQuota, getRemainingToday, DAILY_FREE_LIMIT } from "@/lib/quota";
import { identifyPlant, type Identification } from "@/lib/identify";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [
      { title: "Capture · Florist.ar" },
      {
        name: "description",
        content:
          "Photograph a flower or plant, press it onto archival paper, and name your specimen.",
      },
    ],
  }),
  component: Capture,
});

type Phase = "idle" | "preview" | "processing" | "naming" | "error";

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Capture() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const identifyRef = useRef<Promise<Identification | null> | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [original, setOriginal] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [latin, setLatin] = useState("");
  const [foundAt, setFoundAt] = useState("");
  const [fieldLocation, setFieldLocation] = useState<FieldLocation | null>(null);
  const [habitat, setHabitat] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [identification, setIdentification] = useState<Identification | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [remaining, setRemaining] = useState(() => getRemainingToday());

  function reset() {
    setOriginal(null);
    setPressed(null);
    setName("");
    setLatin("");
    setFoundAt("");
    setFieldLocation(null);
    setHabitat("");
    setColor("");
    setNotes("");
    setError(null);
    setIdentification(null);
    setIdentifying(false);
    identifyRef.current = null;
    setRemaining(getRemainingToday());
    setPhase("idle");
  }

  async function identify(dataUrl: string): Promise<Identification | null> {
    setIdentifying(true);
    const data = await identifyPlant(dataUrl);
    setIdentification(data);
    setIdentifying(false);
    return data;
  }

  async function onFile(file: File) {
    try {
      const dataUrl = await fileToDataURL(file);

      if (!consumeQuota()) {
        setRemaining(0);
        setError(
          `You've used your ${DAILY_FREE_LIMIT} free identifications for today. Come back tomorrow, or upgrade for unlimited.`,
        );
        setPhase("error");
        return;
      }
      setRemaining(getRemainingToday());

      setOriginal(dataUrl);
      setPressed(null);
      setIdentification(null);
      setPhase("preview");
      // Kicked off now so it's often already done by the time the user
      // taps "Press specimen" — press() awaits this same promise below.
      identifyRef.current = identify(dataUrl);
    } catch {
      setError("Couldn't read that image.");
      setPhase("error");
    }
  }

  async function press() {
    if (!original) return;
    setPhase("processing");
    setError(null);
    try {
      const idResult = identifyRef.current ? await identifyRef.current : identification;
      if (!idResult || !idResult.identified) {
        setError(
          "We couldn't recognize this plant. Try a clearer, closer photo of a single flower.",
        );
        setPhase("error");
        return;
      }

      // Prefill from the identification — the user can still edit before saving.
      setName(idResult.commonName ?? "");
      setLatin(idResult.latinName ?? "");
      if (idResult.color) setColor(idResult.color);
      if (idResult.habitat) setHabitat(idResult.habitat);

      const res = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: original }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Request failed (${res.status})`);
      }
      const { image } = (await res.json()) as { image: string };
      setPressed(image);
      setPhase("naming");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pressing failed.");
      setPhase("error");
    }
  }

  function save() {
    if (!pressed || !name.trim()) return;
    const item = addSpecimen({
      name: name.trim(),
      latin: latin.trim(),
      foundAt: foundAt.trim(),
      latitude: fieldLocation?.latitude,
      longitude: fieldLocation?.longitude,
      locationAccuracy: fieldLocation?.accuracy,
      habitat: habitat.trim(),
      color: color.trim(),
      confidence: latin.trim() ? 82 : undefined,
      tags: [color.trim(), habitat.trim()].filter(Boolean),
      notes: notes.trim(),
      image: pressed,
    });
    navigate({ to: "/specimen/$id", params: { id: item.id } });
  }

  return (
    <AppShell>
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/" })}
          className="size-10 rounded-full bg-bone grid place-items-center shadow-sm border border-forest/5"
          aria-label="Close capture"
        >
          <X className="size-4 text-forest" />
        </button>
        <div>
          <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60 text-right">
            New specimen
          </span>
          <h1 className="font-serif text-xl font-bold italic">Capture</h1>
        </div>
      </header>

      <main className="flex-1 px-6 pb-8">
        {phase === "idle" && (
          <IdleView onPick={() => fileRef.current?.click()} remaining={remaining} />
        )}

        {(phase === "preview" || phase === "processing") && original && (
          <PreviewView
            image={original}
            processing={phase === "processing"}
            onRetake={() => fileRef.current?.click()}
            onPress={press}
          />
        )}

        {phase === "naming" && pressed && (
          <NamingView
            image={pressed}
            name={name}
            latin={latin}
            foundAt={foundAt}
            fieldLocation={fieldLocation}
            habitat={habitat}
            color={color}
            notes={notes}
            identification={identification}
            onName={setName}
            onLatin={setLatin}
            onFoundAt={setFoundAt}
            onFieldLocation={setFieldLocation}
            onHabitat={setHabitat}
            onColor={setColor}
            onNotes={setNotes}
            onSave={save}
            onRetake={reset}
          />
        )}

        {phase === "error" && (
          <div className="mt-10 bg-bone rounded-2xl p-6 border border-forest/5 text-center">
            <p className="font-serif italic text-forest">{error}</p>
            <button
              onClick={reset}
              className="mt-5 bg-forest text-bone px-5 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider"
            >
              {remaining === 0 ? "Got it" : "Try again"}
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </main>
    </AppShell>
  );
}

function IdleView({ onPick, remaining }: { onPick: () => void; remaining: number }) {
  if (remaining <= 0) {
    return (
      <div className="mt-4">
        <div className="rounded-3xl bg-bone p-7 border border-forest/5 shadow-sm text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
            Daily limit reached
          </span>
          <h2 className="font-serif text-3xl font-bold italic leading-tight mt-1">
            That's {DAILY_FREE_LIMIT} for today.
          </h2>
          <p className="mt-3 text-sm text-moss/80 leading-relaxed">
            You've used today's free identifications. Come back tomorrow, or upgrade for unlimited
            plant ID.
          </p>
          <button
            disabled
            className="mt-7 w-full bg-forest/40 text-bone py-5 rounded-2xl font-semibold text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2"
          >
            <Camera className="size-5" strokeWidth={1.75} />
            Open camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="rounded-3xl bg-bone p-7 border border-forest/5 shadow-sm">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
          Step one · {remaining} of {DAILY_FREE_LIMIT} free today
        </span>
        <h2 className="font-serif text-3xl font-bold italic leading-tight mt-1">
          Photograph a living specimen.
        </h2>
        <p className="mt-3 text-sm text-moss/80 leading-relaxed">
          Frame a single flower or plant in good light. We'll identify it, lift it cleanly from its
          surroundings, and press it into your journal.
        </p>

        <button
          onClick={onPick}
          className="mt-7 w-full bg-forest text-bone py-5 rounded-2xl font-semibold text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-lg shadow-forest/20 active:scale-[0.99] transition"
        >
          <Camera className="size-5" strokeWidth={1.75} />
          Open camera
        </button>
        <button
          onClick={onPick}
          className="mt-3 w-full bg-sage text-forest py-4 rounded-2xl text-xs font-semibold tracking-[0.15em] uppercase flex items-center justify-center gap-2 border border-forest/5"
        >
          <ImagePlus className="size-4" strokeWidth={1.75} />
          Choose from library
        </button>
      </div>

      <ol className="mt-8 space-y-4 text-sm text-moss/80">
        {[
          "Capture or upload a photo of the plant.",
          "We identify the species and separate it from its background.",
          "Confirm the name, add field notes, and press it into your herbarium.",
        ].map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-serif italic text-gold text-lg leading-none">{i + 1}.</span>
            <span className="leading-snug">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PreviewView({
  image,
  processing,
  onRetake,
  onPress,
}: {
  image: string;
  processing: boolean;
  onRetake: () => void;
  onPress: () => void;
}) {
  return (
    <div className="mt-2">
      <div className="relative rounded-3xl overflow-hidden bg-stone-soft aspect-square shadow-xl">
        <img src={image} alt="Captured specimen" className="w-full h-full object-cover" />
        {processing && (
          <div className="absolute inset-0 bg-forest/40 backdrop-blur-sm flex flex-col items-center justify-center text-bone">
            <div className="size-16 border-2 border-bone/40 border-t-bone rounded-full animate-spin" />
            <p className="mt-5 font-serif italic text-lg">Identifying & pressing…</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-bone/70 mt-1">
              This can take a few seconds
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
        <button
          onClick={onRetake}
          disabled={processing}
          className="px-5 rounded-2xl bg-bone text-forest font-semibold text-xs uppercase tracking-wider border border-forest/5 flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw className="size-4" />
          Retake
        </button>
        <button
          onClick={onPress}
          disabled={processing}
          className="bg-forest text-bone py-5 rounded-2xl font-semibold text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-lg shadow-forest/20 disabled:opacity-60 active:scale-[0.99] transition"
        >
          <Sparkles className="size-5" />
          {processing ? "Pressing" : "Press specimen"}
        </button>
      </div>
    </div>
  );
}

function NamingView({
  image,
  name,
  latin,
  foundAt,
  fieldLocation,
  habitat,
  color,
  notes,
  identification,
  onName,
  onLatin,
  onFoundAt,
  onFieldLocation,
  onHabitat,
  onColor,
  onNotes,
  onSave,
  onRetake,
}: {
  image: string;
  name: string;
  latin: string;
  foundAt: string;
  fieldLocation: FieldLocation | null;
  habitat: string;
  color: string;
  notes: string;
  identification: Identification | null;
  onName: (v: string) => void;
  onLatin: (v: string) => void;
  onFoundAt: (v: string) => void;
  onFieldLocation: (v: FieldLocation | null) => void;
  onHabitat: (v: string) => void;
  onColor: (v: string) => void;
  onNotes: (v: string) => void;
  onSave: () => void;
  onRetake: () => void;
}) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function useGps() {
    setLocating(true);
    setLocationError(null);
    try {
      const next = await getCurrentFieldLocation();
      onFieldLocation(next);
      onFoundAt(formatCoords(next));
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : "Couldn't read your location.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="relative rounded-3xl overflow-hidden bg-white aspect-square shadow-xl border border-forest/5">
        <img src={image} alt="Pressed specimen" className="w-full h-full object-contain p-4" />
        <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60 bg-bone/80 backdrop-blur px-2 py-1 rounded">
          Pressed
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-bone border border-forest/5 p-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
            Storage
          </span>
          <p className="mt-2 text-sm leading-relaxed text-moss/80">
            {isSupabaseConfigured()
              ? "This specimen saves locally first, then syncs to Supabase."
              : "This specimen saves locally. Add Supabase env vars to enable cloud sync."}
          </p>
        </div>

        <div className="rounded-2xl bg-bone border border-forest/5 p-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
            AI identification
          </span>

          {identification?.identified ? (
            <>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-sage px-3 py-2 border border-forest/5">
                <span>
                  <span className="block text-sm font-semibold">{identification.commonName}</span>
                  {identification.latinName && (
                    <span className="block text-[11px] italic text-moss/70">
                      {identification.latinName}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-bold text-gold">
                  {identification.confidence}%
                </span>
              </div>
              {identification.funFact && (
                <p className="mt-2 text-xs italic text-moss/60">{identification.funFact}</p>
              )}
              <p className="mt-2 text-[11px] text-moss/60">
                Not right? Edit the name below before saving.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-moss/80">Identification details unavailable.</p>
          )}
        </div>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
            Give it a name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="e.g. Cottage Rose"
            className="mt-2 w-full bg-bone border border-forest/10 rounded-2xl px-4 py-4 font-serif text-lg italic placeholder:text-moss/40 focus:outline-none focus:border-gold"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
            Latin name
          </span>
          <input
            type="text"
            value={latin}
            onChange={(e) => onLatin(e.target.value)}
            placeholder="e.g. Rosa gallica"
            className="mt-2 w-full bg-bone border border-forest/10 rounded-2xl px-4 py-4 font-serif text-base italic placeholder:text-moss/40 focus:outline-none focus:border-gold"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
              Color
            </span>
            <select
              value={color}
              onChange={(e) => onColor(e.target.value)}
              className="mt-2 w-full bg-bone border border-forest/10 rounded-2xl px-3 py-4 text-sm focus:outline-none focus:border-gold"
            >
              <option value="">Unknown</option>
              {["White", "Yellow", "Pink", "Red", "Blue", "Purple", "Green"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
              Habitat
            </span>
            <select
              value={habitat}
              onChange={(e) => onHabitat(e.target.value)}
              className="mt-2 w-full bg-bone border border-forest/10 rounded-2xl px-3 py-4 text-sm focus:outline-none focus:border-gold"
            >
              <option value="">Unknown</option>
              {["Garden", "Meadow", "Forest", "Roadside", "Wetland", "Indoor"].map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
              Found at
            </span>
            <button
              type="button"
              onClick={useGps}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-forest disabled:opacity-50"
            >
              <Crosshair className="size-3" strokeWidth={1.75} />
              {locating ? "Locating" : "Use GPS"}
            </button>
          </span>
          <input
            type="text"
            value={foundAt}
            onChange={(e) => onFoundAt(e.target.value)}
            placeholder="e.g. North path, Botanic Garden"
            className="mt-2 w-full bg-bone border border-forest/10 rounded-2xl px-4 py-4 text-sm placeholder:text-moss/40 focus:outline-none focus:border-gold"
          />
          {fieldLocation && (
            <span className="mt-2 flex items-center gap-1.5 text-[11px] text-moss/70">
              <MapPin className="size-3" strokeWidth={1.75} />
              GPS saved, accurate to about {Math.round(fieldLocation.accuracy)}m.
            </span>
          )}
          {locationError && (
            <span className="mt-2 block text-[11px] text-red-700">{locationError}</span>
          )}
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
            Field notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder="Where you found it, the light, the scent…"
            rows={3}
            className="mt-2 w-full bg-bone border border-forest/10 rounded-2xl px-4 py-3 text-sm leading-relaxed placeholder:text-moss/40 focus:outline-none focus:border-gold resize-none"
          />
        </label>

        <div className="grid grid-cols-[auto_1fr] gap-3 pt-2">
          <button
            onClick={onRetake}
            className="px-5 rounded-2xl bg-bone text-forest font-semibold text-xs uppercase tracking-wider border border-forest/5"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={!name.trim()}
            className="bg-forest text-bone py-5 rounded-2xl font-semibold text-sm tracking-[0.15em] uppercase shadow-lg shadow-forest/20 disabled:opacity-40 active:scale-[0.99] transition"
          >
            Press into Herbarium
          </button>
        </div>
      </div>
    </div>
  );
}
