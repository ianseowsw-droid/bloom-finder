import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  ImagePlus,
  Info,
  Leaf,
  MapPin,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import heroImg from "@/assets/hero-monstera.jpg";
import {
  addSpecimen,
  collectionStats,
  specimenTags,
  timeAgo,
  useCollection,
  type Specimen,
} from "@/lib/collection";
import { identifyPlant, type Identification } from "@/lib/identify";
import { formatCoords, getCurrentFieldLocation, type FieldLocation } from "@/lib/location";
import { plants, rarityClass, type Plant } from "@/lib/plants";
import { isAppleSignInAvailable, isSupabaseConfigured, signInWithApple } from "@/lib/supabase";
import { loadProfile, saveProfile, type Profile } from "@/lib/profile";
import { consumeQuota, getRemainingToday, DAILY_FREE_LIMIT } from "@/lib/quota";

// The native app has no server of its own — every /api/* call must be
// absolute, pointed at the deployed web app. Set VITE_API_BASE_URL at
// build time (see .env.example). Falls back to same-origin for local
// testing in a browser, where it's harmless.
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

type Screen =
  | { name: "field" }
  | { name: "herbarium" }
  | { name: "capture" }
  | { name: "discover" }
  | { name: "profile" }
  | { name: "specimen"; id: string }
  | { name: "species"; id: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "field" });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const go = (next: Screen) => setScreen(next);

  useEffect(() => {
    void loadProfile().then((next) => {
      setProfile(next);
      setCheckingProfile(false);
    });
  }, []);

  if (checkingProfile) {
    return <LaunchScreen />;
  }

  if (!profile) {
    return (
      <Onboarding
        onComplete={(next) => {
          setProfile(next);
          setScreen({ name: "field" });
        }}
      />
    );
  }

  return (
    <div className="mobile-viewport bg-sage font-sans text-forest">
      <div className="mobile-scroll mobile-content-bottom flex w-full flex-col bg-sage">
        {screen.name === "field" && <Field go={go} profile={profile} />}
        {screen.name === "herbarium" && <Herbarium go={go} />}
        {screen.name === "capture" && <Capture go={go} />}
        {screen.name === "discover" && <Discover go={go} />}
        {screen.name === "profile" && (
          <ProfileScreen profile={profile} onProfileChange={setProfile} />
        )}
        {screen.name === "specimen" && <SpecimenPage id={screen.id} go={go} />}
        {screen.name === "species" && <SpeciesPage id={screen.id} go={go} />}
      </div>
      <BottomNav active={screen.name} go={go} />
    </div>
  );
}

function Field({ go, profile }: { go: (screen: Screen) => void; profile: Profile }) {
  const collection = useCollection();
  const recent = collection.slice(0, 6);
  const stats = collectionStats(collection);
  const nextGoal =
    collection.length < 3
      ? `${3 - collection.length} more to first set`
      : stats.habitats < 2
        ? "Record a new habitat"
        : "Field set complete";
  const completedSteps = Math.min(collection.length, 3);

  return (
    <>
      <nav className="field-header-safe-top sticky top-0 z-20 flex items-center justify-between bg-sage/90 px-6 pb-3 backdrop-blur-md">
        <div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-moss/60">
            {profile.displayName}'s Field Report
          </span>
          <h1 className="font-serif text-[1.7rem] font-bold italic leading-none">Florist.ar</h1>
        </div>
        <button
          type="button"
          onClick={() => go({ name: "profile" })}
          className="rounded-full border border-white/70 bg-bone p-0.5 shadow-sm active:scale-95"
          aria-label="Open profile"
        >
          <Avatar profile={profile} size="sm" />
        </button>
      </nav>

      <main className="flex-1 px-4 py-2">
        <section className="mb-4 rounded-[1.75rem] border border-forest/5 bg-bone p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold">
                Today&apos;s hunt
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold leading-tight">
                Find, press, collect.
              </h2>
            </div>
            <div className="grid size-12 place-items-center rounded-2xl bg-forest text-bone">
              <Trophy className="size-5 text-gold" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MissionStep index="01" title="Spot" done={completedSteps > 0} />
            <MissionStep index="02" title="Press" done={completedSteps > 1} />
            <MissionStep index="03" title="Collect" done={completedSteps > 2} />
          </div>
        </section>
        <button
          type="button"
          onClick={() => go({ name: "capture" })}
          className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-stone-soft text-left shadow-2xl"
        >
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/20 via-forest/10 to-forest/85" />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="w-fit rounded-full border border-bone/20 bg-forest/80 px-3 py-1.5 text-xs font-medium text-bone backdrop-blur-md">
                Live encounter
              </span>
              <span className="rounded-full border border-bone/20 bg-bone/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-forest">
                3 tries
              </span>
            </div>
            <div className="absolute inset-8">
              <span className="absolute left-0 top-24 h-12 w-12 border-l-2 border-t-2 border-gold" />
              <span className="absolute right-0 top-24 h-12 w-12 border-r-2 border-t-2 border-gold" />
              <span className="absolute bottom-40 left-0 h-12 w-12 border-b-2 border-l-2 border-gold" />
              <span className="absolute bottom-40 right-0 h-12 w-12 border-b-2 border-r-2 border-gold" />
            </div>
            <div className="rounded-2xl border border-forest/5 bg-bone/95 p-6 shadow-xl backdrop-blur-lg">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
                Open the camera
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold italic leading-tight">
                Hunt a specimen
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-moss/80">
                Frame a flower or plant, pass the guide checks, then add it to your herbarium.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  Start encounter
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-forest text-bone shadow-md">
                  <Camera className="size-4" strokeWidth={1.75} />
                </span>
              </div>
            </div>
          </div>
        </button>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Specimens" value={collection.length} />
          <SmallStat
            label="Latest"
            value={collection[0] ? timeAgo(collection[0].createdAt) : "-"}
          />
          <Stat label="Habitats" value={stats.habitats} />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-forest p-4 text-bone">
          <CheckCircle2 className="size-5 text-gold" strokeWidth={1.75} />
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-bone/60">
              Next field goal
            </span>
            <span className="block font-serif text-lg font-bold">{nextGoal}</span>
          </div>
        </div>
      </main>

      <section className="mt-4 rounded-t-[3rem] bg-bone px-6 py-8 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold">
              Collection
            </span>
            <h3 className="font-serif text-2xl font-bold">Specimen Album</h3>
          </div>
          <button
            type="button"
            onClick={() => go({ name: "herbarium" })}
            className="text-xs font-bold uppercase tracking-widest text-gold"
          >
            View All
          </button>
        </div>
        {recent.length === 0 ? (
          <button
            type="button"
            onClick={() => go({ name: "capture" })}
            className="block w-full rounded-2xl border-2 border-dashed border-moss/30 p-8 text-center"
          >
            <p className="font-serif italic text-moss">No collectible cards yet.</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              Start your first hunt
            </p>
          </button>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {recent.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go({ name: "specimen", id: s.id })}
                className="w-36 flex-shrink-0 overflow-hidden rounded-2xl border border-forest/5 bg-sage text-left shadow-sm"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
                  <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-bone/90 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-gold">
                    #{s.id.slice(-4)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate font-serif text-sm font-bold">{s.name}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-wider text-moss/60">
                    Found {timeAgo(s.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function LaunchScreen() {
  return (
    <div className="mobile-viewport grid place-items-center bg-forest px-8 text-center text-bone">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-bone/10">
          <Leaf className="size-8 text-gold" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-serif text-4xl font-bold italic">Bloom Finder</h1>
        <p className="mt-3 text-sm leading-relaxed text-bone/70">Preparing your field journal.</p>
      </div>
    </div>
  );
}

function Onboarding({ onComplete }: { onComplete: (profile: Profile) => void }) {
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("");
  const [experience, setExperience] = useState("New naturalist");
  const [shareLocation, setShareLocation] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueWithApple() {
    setSaving(true);
    setError(null);
    try {
      const result = await signInWithApple();
      const nameOverride = result.givenName && !displayName.trim() ? result.givenName : undefined;
      if (nameOverride) setDisplayName(nameOverride);
      await submit(nameOverride);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in with Apple failed.");
      setSaving(false);
    }
  }

  async function submit(nameOverride?: string) {
    const name = nameOverride ?? displayName;
    if (!name.trim()) {
      setError("Add a display name to continue.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const profile = await saveProfile({
        displayName: name.trim(),
        region: region.trim(),
        experience,
        shareLocation,
      });
      onComplete(profile);
    } catch {
      setError("Profile setup failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mobile-viewport mobile-safe-top bg-sage px-6 pb-10 text-forest">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-[2rem] bg-forest p-6 text-bone shadow-2xl shadow-forest/20">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bone/60">
            Account setup
          </span>
          <h1 className="mt-2 font-serif text-4xl font-bold italic leading-tight">
            Create your field profile.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bone/75">
            Bloom Finder creates a secure Supabase session, then saves your herbarium, specimens,
            and preferences to your account.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <Input
            label="Display name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="e.g. Ian"
            serif
          />
          <Input
            label="Home region"
            value={region}
            onChange={setRegion}
            placeholder="e.g. Singapore, Sydney, Pacific Northwest"
          />
          <Select
            label="Experience"
            value={experience}
            onChange={setExperience}
            options={["New naturalist", "Garden hobbyist", "Field recorder", "Botany pro"]}
          />

          <button
            type="button"
            onClick={() => setShareLocation((next) => !next)}
            className="flex w-full items-center justify-between rounded-2xl border border-forest/5 bg-bone p-4 text-left"
          >
            <span>
              <span className="block text-sm font-semibold">Location-assisted discoveries</span>
              <span className="mt-1 block text-xs leading-relaxed text-moss/70">
                Use GPS for specimen coordinates and future region-based plant suggestions.
              </span>
            </span>
            <span
              className={
                "ml-4 h-7 w-12 rounded-full p-1 transition " +
                (shareLocation ? "bg-forest" : "bg-moss/20")
              }
            >
              <span
                className={
                  "block size-5 rounded-full bg-bone transition " +
                  (shareLocation ? "translate-x-5" : "")
                }
              />
            </span>
          </button>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="w-full rounded-2xl bg-forest py-5 text-sm font-semibold uppercase tracking-[0.15em] text-bone shadow-lg shadow-forest/20 disabled:opacity-50"
          >
            {saving ? "Creating profile" : "Enter Bloom Finder"}
          </button>

          {isAppleSignInAvailable() && (
            <button
              type="button"
              onClick={() => void continueWithApple()}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-forest/10 bg-bone py-4 text-sm font-semibold text-forest shadow-sm disabled:opacity-50"
            >
              <svg viewBox="0 0 384 512" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              Continue with Apple
            </button>
          )}

          <p className="px-2 text-center text-[11px] leading-relaxed text-moss/70">
            {isAppleSignInAvailable()
              ? "Sign in with Apple creates a secure Supabase session tied to your Apple ID."
              : "This build uses Supabase anonymous auth so you can test the full account flow today."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Herbarium({ go }: { go: (screen: Screen) => void }) {
  const collection = useCollection();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const stats = collectionStats(collection);
  const filters = useMemo(
    () => ["All", ...Array.from(new Set(collection.flatMap(specimenTags))).slice(0, 6)],
    [collection],
  );
  const filtered = collection.filter((s) => {
    const haystack = [s.name, s.latin, s.notes, s.foundAt, s.habitat, s.color]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      haystack.includes(query.trim().toLowerCase()) &&
      (filter === "All" || specimenTags(s).includes(filter))
    );
  });

  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title="Specimen Album"
        copy={
          collection.length === 0
            ? "Your album is empty. Start a plant hunt to earn your first card."
            : `${collection.length} collectible specimen card${collection.length === 1 ? "" : "s"} in your album.`
        }
      />
      <main className="flex-1 px-6">
        {collection.length === 0 ? (
          <button
            type="button"
            onClick={() => go({ name: "capture" })}
            className="block w-full rounded-3xl border-2 border-dashed border-moss/30 bg-bone/50 p-10 text-center"
          >
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-forest text-bone shadow-lg shadow-forest/20">
              <Camera className="size-6" strokeWidth={1.75} />
            </div>
            <p className="mt-5 font-serif text-lg italic text-forest">Earn your first plant card</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-moss/60">
              Start encounter
            </p>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Pressed" value={stats.specimens} />
              <Stat label="Habitats" value={stats.habitats} />
              <Stat label="Colors" value={stats.colors} />
              <Stat label="IDs" value={stats.identified} />
            </div>
            <section className="mt-5 rounded-2xl border border-forest/5 bg-bone p-4">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-moss" strokeWidth={1.75} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search card, place, notes"
                  className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-moss/40 focus:outline-none"
                />
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
                {filters.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={
                      "whitespace-nowrap rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider " +
                      (filter === f
                        ? "border-forest bg-forest text-bone"
                        : "border-forest/5 bg-sage text-moss")
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            </section>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {filtered.map((s) => (
                <SpecimenCardButton
                  key={s.id}
                  specimen={s}
                  onClick={() => go({ name: "specimen", id: s.id })}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function Capture({ go }: { go: (screen: Screen) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [latin, setLatin] = useState("");
  const [foundAt, setFoundAt] = useState("");
  const [fieldLocation, setFieldLocation] = useState<FieldLocation | null>(null);
  const [habitat, setHabitat] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [identification, setIdentification] = useState<Identification | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(() => getRemainingToday());
  const checks = image
    ? [
        { title: "Bloom found", detail: "Flower or plant subject is visible", done: true },
        { title: "Field photo ready", detail: "Image can become a specimen card", done: true },
      ]
    : [
        { title: "Find a plant", detail: "Point camera at a living flower or leaf", done: false },
        {
          title: "Frame the subject",
          detail: "Keep the plant inside the guide corners",
          done: false,
        },
      ];

  async function onFile(file: File) {
    setCaptureError(null);

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Couldn't read that image."));
      reader.readAsDataURL(file);
    }).catch(() => null);

    if (!dataUrl) {
      setCaptureError("Couldn't read that image.");
      return;
    }

    if (!consumeQuota()) {
      setRemaining(0);
      setCaptureError(
        `You've used your ${DAILY_FREE_LIMIT} free identifications for today. Come back tomorrow, or upgrade for unlimited.`,
      );
      return;
    }
    setRemaining(getRemainingToday());

    setIdentifying(true);
    const result = await identifyPlant(dataUrl, API_BASE);
    setIdentifying(false);

    if (!result || !result.identified) {
      setIdentification(null);
      setCaptureError(
        "We couldn't recognize this plant. Try a clearer, closer photo of a single flower.",
      );
      return;
    }

    setIdentification(result);
    setName(result.commonName ?? "");
    setLatin(result.latinName ?? "");
    if (result.color) setColor(result.color);
    if (result.habitat) setHabitat(result.habitat);
    setImage(dataUrl);
  }

  async function useGps() {
    setLocating(true);
    setLocationError(null);
    try {
      const next = await getCurrentFieldLocation();
      setFieldLocation(next);
      setFoundAt(formatCoords(next));
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : "Couldn't read your location.");
    } finally {
      setLocating(false);
    }
  }

  function save() {
    if (!image || !name.trim()) return;
    const item = addSpecimen({
      name: name.trim(),
      latin: latin.trim(),
      foundAt: foundAt.trim(),
      latitude: fieldLocation?.latitude,
      longitude: fieldLocation?.longitude,
      locationAccuracy: fieldLocation?.accuracy,
      habitat: habitat.trim(),
      color: color.trim(),
      confidence: identification?.confidence,
      tags: [color.trim(), habitat.trim()].filter(Boolean),
      notes: notes.trim(),
      image,
    });
    go({ name: "specimen", id: item.id });
  }

  const quotaExhausted = remaining <= 0 && !image;

  return (
    <>
      <main className="min-h-dvh flex-1 bg-[#151812] px-4 pb-8 text-bone">
        <div className="mobile-safe-top flex items-center justify-between pb-4">
          <button
            onClick={() => go({ name: "field" })}
            className="grid size-10 place-items-center rounded-full border border-bone/20 bg-bone/90 text-forest shadow-lg"
            aria-label="Close capture"
          >
            <X className="size-4" />
          </button>
          <div className="rounded-full border border-bone/15 bg-bone/10 px-4 py-2 text-center backdrop-blur-md">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-bone/55">
              Encounter
            </span>
            <span className="block text-sm font-bold">Plant hunt</span>
          </div>
          <button
            type="button"
            onClick={useGps}
            disabled={locating}
            className="grid size-10 place-items-center rounded-full border border-bone/20 bg-bone/90 text-forest shadow-lg disabled:opacity-60"
            aria-label="Use GPS"
          >
            <Crosshair className="size-4" />
          </button>
        </div>

        {!image ? (
          <div className="space-y-4">
            <section className="rounded-3xl border border-bone/15 bg-bone p-3 text-forest shadow-2xl">
              <div className="space-y-2">
                {checks.map((check) => (
                  <div
                    key={check.title}
                    className="flex items-center gap-3 rounded-2xl bg-sage px-3 py-3"
                  >
                    <span className="grid size-11 place-items-center rounded-xl border-2 border-gold bg-bone">
                      <Leaf className="size-5 text-gold" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{check.title}</p>
                      <p className="truncate text-xs text-moss/70">{check.detail}</p>
                    </div>
                    <CheckCircle2 className="size-5 text-moss/30" strokeWidth={1.75} />
                  </div>
                ))}
              </div>
            </section>

            <section className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-bone/10 bg-gradient-to-b from-[#44523e] via-[#263326] to-[#0d160f] shadow-2xl">
              <img
                src={heroImg}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-55 blur-[1px]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />

              {identifying ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-forest/50 backdrop-blur-sm">
                  <div className="size-14 animate-spin rounded-full border-2 border-bone/40 border-t-bone" />
                  <p className="mt-4 font-serif text-lg italic">Identifying…</p>
                </div>
              ) : quotaExhausted ? (
                <div className="absolute left-6 right-6 top-16 rounded-3xl border border-bone/20 bg-bone/10 p-5 text-center backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                    Daily limit reached
                  </span>
                  <h2 className="mt-2 font-serif text-3xl font-bold italic leading-tight">
                    That's {DAILY_FREE_LIMIT} for today.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-bone/75">
                    Come back tomorrow, or upgrade for unlimited plant ID.
                  </p>
                </div>
              ) : (
                <div className="absolute left-6 right-6 top-16 rounded-3xl border border-bone/20 bg-bone/10 p-5 text-center backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                    Live guide
                  </span>
                  <h2 className="mt-2 font-serif text-3xl font-bold italic leading-tight">
                    Spot a bloom in the real world.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-bone/75">
                    Open the camera and frame the plant — we'll identify it on the spot.
                  </p>
                </div>
              )}

              <div className="pointer-events-none absolute inset-8">
                <span className="absolute left-0 top-16 h-16 w-16 border-l-2 border-t-2 border-gold" />
                <span className="absolute right-0 top-16 h-16 w-16 border-r-2 border-t-2 border-gold" />
                <span className="absolute bottom-20 left-0 h-16 w-16 border-b-2 border-l-2 border-gold" />
                <span className="absolute bottom-20 right-0 h-16 w-16 border-b-2 border-r-2 border-gold" />
              </div>
              <div className="absolute bottom-5 left-5 rounded-2xl border border-bone/20 bg-bone px-4 py-3 text-forest shadow-xl">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  {remaining} / {DAILY_FREE_LIMIT} tries
                </span>
              </div>
              <div className="absolute bottom-5 right-5 flex flex-col gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={identifying || quotaExhausted}
                  className="grid size-14 place-items-center rounded-full bg-gold text-forest shadow-xl active:scale-95 disabled:opacity-40"
                  aria-label="Open camera"
                >
                  <Camera className="size-6" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={identifying || quotaExhausted}
                  className="grid size-11 place-items-center rounded-full border border-bone/20 bg-bone/90 text-forest shadow-lg active:scale-95 disabled:opacity-40"
                  aria-label="Choose from library"
                >
                  <ImagePlus className="size-5" strokeWidth={1.75} />
                </button>
              </div>
            </section>

            {captureError ? (
              <div className="rounded-3xl border border-bone/10 bg-bone/10 p-4 backdrop-blur-md">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  {quotaExhausted ? "Limit reached" : "Not recognized"}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-bone/75">{captureError}</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-bone/10 bg-bone/10 p-4 backdrop-blur-md">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bone/50">
                  How capture works
                </span>
                <p className="mt-2 text-sm leading-relaxed text-bone/75">
                  Snap a photo — we identify the species, then you confirm and add field notes.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-3xl border border-bone/15 bg-bone p-3 text-forest shadow-2xl">
              {checks.map((check) => (
                <div
                  key={check.title}
                  className="flex items-center gap-3 border-b border-forest/5 px-2 py-3 last:border-0"
                >
                  <span className="grid size-11 place-items-center rounded-xl border-2 border-gold bg-sage">
                    <Leaf className="size-5 text-gold" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{check.title}</p>
                    <p className="truncate text-xs text-moss/70">{check.detail}</p>
                  </div>
                  <CheckCircle2 className="size-5 text-gold" strokeWidth={1.75} />
                </div>
              ))}
            </section>

            <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-bone/10 bg-white shadow-2xl">
              <img src={image} alt="Pressed specimen" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
              <div className="pointer-events-none absolute inset-7">
                <span className="absolute left-0 top-12 h-14 w-14 border-l-2 border-t-2 border-gold" />
                <span className="absolute right-0 top-12 h-14 w-14 border-r-2 border-t-2 border-gold" />
                <span className="absolute bottom-24 left-0 h-14 w-14 border-b-2 border-l-2 border-gold" />
                <span className="absolute bottom-24 right-0 h-14 w-14 border-b-2 border-r-2 border-gold" />
              </div>
              <span className="absolute left-4 top-4 rounded-full border border-bone/20 bg-bone/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-forest backdrop-blur">
                {identification ? `Identified · ${identification.confidence}%` : "Plant found"}
              </span>
              <div className="absolute inset-x-5 bottom-5 rounded-3xl border border-bone/20 bg-bone p-5 text-forest shadow-2xl">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                  Specimen card
                </span>
                <h2 className="mt-1 font-serif text-3xl font-bold italic leading-tight">
                  {name.trim() || "Unnamed bloom"}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-moss/75">
                  Rarity, confidence, habitat, and location become part of this collectible once
                  saved.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-sage px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-moss">
                    #FIELD-{String(Date.now()).slice(-4)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setIdentification(null);
                      setCaptureError(null);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-gold"
                  >
                    Retake
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-[2rem] bg-sage p-4 text-forest">
              {identification?.identified && (
                <div className="rounded-2xl border border-forest/5 bg-bone p-4 shadow-sm">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
                    AI identification
                  </span>
                  <div className="mt-2 flex items-center justify-between">
                    <span>
                      <span className="block text-sm font-semibold">
                        {identification.commonName}
                      </span>
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
                </div>
              )}
              <div className="rounded-2xl border border-forest/5 bg-bone p-4 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
                  Storage
                </span>
                <p className="mt-2 text-sm leading-relaxed text-moss/80">
                  {isSupabaseConfigured()
                    ? "This specimen saves locally first, then syncs to Supabase."
                    : "This specimen saves locally until Supabase is configured."}
                </p>
              </div>
              <Input
                label="Give it a name"
                value={name}
                onChange={setName}
                placeholder="e.g. Cottage Rose"
                serif
              />
              <Input
                label="Latin name"
                value={latin}
                onChange={setLatin}
                placeholder="e.g. Rosa gallica"
                serif
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Color"
                  value={color}
                  onChange={setColor}
                  options={["White", "Yellow", "Pink", "Red", "Blue", "Purple", "Green"]}
                />
                <Select
                  label="Habitat"
                  value={habitat}
                  onChange={setHabitat}
                  options={["Garden", "Meadow", "Forest", "Roadside", "Wetland", "Indoor"]}
                />
              </div>
              <label className="block">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
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
                  value={foundAt}
                  onChange={(e) => setFoundAt(e.target.value)}
                  placeholder="e.g. North path, Botanic Garden"
                  className="mt-2 w-full rounded-2xl border border-forest/10 bg-bone px-4 py-4 text-sm placeholder:text-moss/40 focus:border-gold focus:outline-none"
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
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
                  Field notes
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Where you found it, the light, the scent..."
                  className="mt-2 w-full resize-none rounded-2xl border border-forest/10 bg-bone px-4 py-3 text-sm leading-relaxed placeholder:text-moss/40 focus:border-gold focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-[auto_1fr] gap-3 pt-2">
                <button
                  onClick={() => {
                    setImage(null);
                    setIdentification(null);
                    setCaptureError(null);
                  }}
                  className="rounded-2xl border border-forest/5 bg-bone px-5 text-xs font-semibold uppercase tracking-wider text-forest"
                >
                  Retake
                </button>
                <button
                  onClick={save}
                  disabled={!name.trim()}
                  className="rounded-2xl bg-forest py-5 text-sm font-semibold uppercase tracking-[0.15em] text-bone shadow-lg shadow-forest/20 disabled:opacity-40"
                >
                  Add to Collection
                </button>
              </div>
            </div>
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
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </main>
    </>
  );
}

function Discover({ go }: { go: (screen: Screen) => void }) {
  const collection = useCollection();
  const colorCount = new Set(collection.map((s) => s.color).filter(Boolean)).size;
  const habitatCount = new Set(collection.map((s) => s.habitat).filter(Boolean)).size;
  const quests = [
    {
      title: "Press your first specimen",
      detail: "Capture any plant and save it to your herbarium.",
      progress: Math.min(collection.length, 1),
      total: 1,
    },
    {
      title: "Find 3 bloom colors",
      detail: "Add color data while saving specimens.",
      progress: Math.min(colorCount, 3),
      total: 3,
    },
    {
      title: "Record 2 habitats",
      detail: "Save plants from different places.",
      progress: Math.min(habitatCount, 2),
      total: 2,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Field guide"
        title="Discover"
        copy="Browse plants that may be nearby, then tap a card to learn what to look for."
      />
      <main className="flex-1 space-y-5 px-6">
        <section className="rounded-3xl border border-forest/5 bg-bone p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sage text-forest">
              <Info className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-serif text-xl font-bold">How this page works</h2>
              <p className="mt-1 text-sm leading-relaxed text-moss/80">
                These are sample plant sightings for the current app build. Your GPS-to-region
                matching can plug into this list later.
              </p>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => go({ name: "capture" })}
            className="rounded-2xl bg-forest p-4 text-left text-bone shadow-lg shadow-forest/10"
          >
            <Camera className="size-5" strokeWidth={1.75} />
            <span className="mt-5 block text-[10px] uppercase tracking-[0.2em] text-bone/60">
              Found one?
            </span>
            <span className="mt-1 block font-serif text-xl font-bold">Capture it</span>
          </button>
          <div className="rounded-2xl border border-forest/5 bg-bone p-4">
            <Search className="size-5 text-moss" strokeWidth={1.75} />
            <span className="mt-5 block text-[10px] uppercase tracking-[0.2em] text-moss/60">
              Nearby list
            </span>
            <span className="mt-1 block font-serif text-xl font-bold">{plants.length} plants</span>
          </div>
        </section>
        <section className="rounded-3xl border border-forest/5 bg-bone p-5 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
                Challenges
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold">Collection goals</h2>
            </div>
            <span className="text-xs font-bold text-gold">
              {quests.filter((q) => q.progress >= q.total).length}/{quests.length}
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {quests.map((quest) => (
              <Quest key={quest.title} {...quest} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-serif text-2xl font-bold">Plants to look for</h2>
          <p className="mt-1 text-xs text-moss/70">Ordered by estimated distance from you.</p>
          <div className="mt-3 space-y-3">
            {plants.map((p, i) => (
              <button
                key={p.id}
                onClick={() => go({ name: "species", id: p.id })}
                className="flex w-full items-center gap-4 rounded-2xl border border-forest/5 bg-bone p-3 text-left shadow-sm"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="size-20 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={
                        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest " +
                        rarityClass[p.rarity]
                      }
                    >
                      {p.rarity}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-moss/60">
                      <MapPin className="size-3" />
                      {(0.2 + i * 0.3).toFixed(1)} mi
                    </span>
                  </div>
                  <h3 className="truncate font-serif text-lg font-bold leading-tight">{p.name}</h3>
                  <p className="truncate text-[11px] italic text-moss/70">{p.latin}</p>
                  <p className="mt-1 truncate text-xs text-moss/80">{p.habitat}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-moss/40" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function ProfileScreen({
  profile,
  onProfileChange,
}: {
  profile: Profile;
  onProfileChange: (profile: Profile) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const collection = useCollection();
  const stats = collectionStats(collection);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [region, setRegion] = useState(profile.region);
  const [experience, setExperience] = useState(profile.experience || "New naturalist");
  const [shareLocation, setShareLocation] = useState(profile.shareLocation);
  const [avatarImage, setAvatarImage] = useState(profile.avatarImage ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onAvatarFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarImage(String(reader.result));
      setSaved(false);
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!displayName.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      const next = await saveProfile({
        displayName: displayName.trim(),
        region: region.trim(),
        experience,
        shareLocation,
        avatarImage,
        createdAt: profile.createdAt,
      });
      onProfileChange(next);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="mobile-safe-top px-6 pb-6">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
          Account
        </span>
        <h1 className="font-serif text-4xl font-bold italic leading-tight">Profile</h1>
        <p className="mt-2 max-w-[34ch] text-sm text-moss/80">
          Manage the identity attached to your herbarium and field records.
        </p>
      </header>
      <main className="flex-1 space-y-5 px-6">
        <section className="rounded-3xl border border-forest/5 bg-bone p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative rounded-[1.75rem] border border-forest/5 bg-sage p-1 shadow-sm active:scale-95"
              aria-label="Change profile photo"
            >
              <Avatar profile={{ ...profile, displayName, avatarImage }} size="lg" />
              <span className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-forest text-bone shadow-lg">
                <Camera className="size-4" strokeWidth={1.75} />
              </span>
            </button>
            <div className="min-w-0">
              <h2 className="truncate font-serif text-2xl font-bold">
                {displayName || "New naturalist"}
              </h2>
              <p className="mt-1 text-sm text-moss/70">{region || "No home region set"}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                Tap photo to change
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onAvatarFile(f);
              e.target.value = "";
            }}
          />
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Stat label="Specimens" value={collection.length} />
          <Stat label="Habitats" value={stats.habitats} />
          <Stat label="Colors" value={stats.colors} />
        </section>

        <section className="space-y-4 rounded-3xl border border-forest/5 bg-bone p-5 shadow-sm">
          <Input
            label="Display name"
            value={displayName}
            onChange={(value) => {
              setDisplayName(value);
              setSaved(false);
            }}
            placeholder="e.g. Ian"
            serif
          />
          <Input
            label="Home region"
            value={region}
            onChange={(value) => {
              setRegion(value);
              setSaved(false);
            }}
            placeholder="e.g. Singapore, Sydney"
          />
          <Select
            label="Experience"
            value={experience}
            onChange={(value) => {
              setExperience(value);
              setSaved(false);
            }}
            options={["New naturalist", "Garden hobbyist", "Field recorder", "Botany pro"]}
          />
          <button
            type="button"
            onClick={() => {
              setShareLocation((next) => !next);
              setSaved(false);
            }}
            className="flex w-full items-center justify-between rounded-2xl bg-sage p-4 text-left"
          >
            <span>
              <span className="block text-sm font-semibold">Location-assisted discoveries</span>
              <span className="mt-1 block text-xs leading-relaxed text-moss/70">
                Use GPS for specimens and future nearby plant suggestions.
              </span>
            </span>
            <span
              className={
                "ml-4 h-7 w-12 rounded-full p-1 transition " +
                (shareLocation ? "bg-forest" : "bg-moss/20")
              }
            >
              <span
                className={
                  "block size-5 rounded-full bg-bone transition " +
                  (shareLocation ? "translate-x-5" : "")
                }
              />
            </span>
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !displayName.trim()}
            className="w-full rounded-2xl bg-forest py-5 text-sm font-semibold uppercase tracking-[0.15em] text-bone shadow-lg shadow-forest/20 disabled:opacity-50"
          >
            {saving ? "Saving" : saved ? "Saved" : "Save profile"}
          </button>
        </section>

        <section className="rounded-3xl border border-forest/5 bg-bone p-5 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
            Storage
          </span>
          <p className="mt-2 text-sm leading-relaxed text-moss/80">
            {isSupabaseConfigured()
              ? "Your profile details sync to Supabase. Profile photos are stored on this device for now."
              : "Profile details are stored on this device until Supabase is configured."}
          </p>
        </section>
      </main>
    </>
  );
}

function SpecimenPage({ id, go }: { id: string; go: (screen: Screen) => void }) {
  const specimen = useCollection().find((s) => s.id === id);
  if (!specimen) {
    return <EmptyDetail title="Specimen not found" onBack={() => go({ name: "herbarium" })} />;
  }
  return (
    <>
      <main className="min-h-dvh bg-[#151812] px-5 pb-10 text-bone">
        <div className="mobile-safe-top flex items-center justify-between pb-5">
          <button
            onClick={() => go({ name: "herbarium" })}
            className="grid size-10 place-items-center rounded-full border border-bone/20 bg-bone/90 text-forest shadow-lg"
            aria-label="Back"
          >
            <X className="size-4 rotate-45" />
          </button>
          <span className="rounded-full border border-bone/15 bg-bone/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-bone/70 backdrop-blur-md">
            Card #{specimen.id.slice(-6)}
          </span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-bone/20 bg-bone text-forest shadow-2xl">
          <div className="relative aspect-[4/5] overflow-hidden bg-white">
            <img src={specimen.image} alt={specimen.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/45" />
            <div className="absolute left-4 top-4 rounded-full bg-bone/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gold">
              {specimen.color || "Pressed"}
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-bone/95 p-4 shadow-xl backdrop-blur">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold">
                Personal specimen
              </span>
              <h1 className="mt-1 font-serif text-3xl font-bold italic leading-tight">
                {specimen.name}
              </h1>
              {specimen.latin && (
                <p className="mt-1 font-serif text-sm italic text-moss">{specimen.latin}</p>
              )}
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox icon={Leaf} label="Habitat" value={specimen.habitat || "Unknown"} />
              <InfoBox icon={MapPin} label="Found at" value={specimen.foundAt || "Not recorded"} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniTrait label="Rarity" value={specimen.confidence ? "Known" : "Wild"} />
              <MiniTrait label="Color" value={specimen.color || "?"} />
              <MiniTrait label="Age" value={timeAgo(specimen.createdAt)} />
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-bone/10 bg-bone/10 p-5 backdrop-blur-md">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bone/50">
            Field notes
          </span>
          {specimen.notes ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bone/80">
              {specimen.notes}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-bone/45">No field notes recorded.</p>
          )}
        </section>
      </main>
    </>
  );
}

function SpecimenCardButton({ specimen, onClick }: { specimen: Specimen; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="overflow-hidden rounded-2xl border border-forest/5 bg-bone text-left shadow-sm active:scale-[0.99]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <img src={specimen.image} alt={specimen.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-forest/55" />
        <span className="absolute left-2 top-2 rounded-full bg-bone/90 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-gold">
          #{specimen.id.slice(-4)}
        </span>
        <span className="absolute bottom-2 left-2 rounded-full bg-forest/90 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-bone">
          {specimen.color || "Wild"}
        </span>
      </div>
      <div className="p-3">
        <h4 className="truncate font-serif text-base font-bold leading-tight">{specimen.name}</h4>
        <p className="mt-1 truncate text-[10px] italic text-moss/70">
          {specimen.latin || specimen.habitat || timeAgo(specimen.createdAt)}
        </p>
      </div>
    </button>
  );
}

function MissionStep({ index, title, done }: { index: string; title: string; done: boolean }) {
  return (
    <div
      className={
        "rounded-2xl border p-3 text-center " +
        (done ? "border-gold/30 bg-gold/10" : "border-forest/5 bg-sage")
      }
    >
      <span className="block text-[9px] font-bold text-gold">{index}</span>
      <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-forest">
        {title}
      </span>
    </div>
  );
}

function MiniTrait({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sage p-3 text-center">
      <span className="block text-[8px] font-bold uppercase tracking-wider text-moss/60">
        {label}
      </span>
      <span className="mt-1 block truncate font-serif text-sm font-bold">{value}</span>
    </div>
  );
}

function SpeciesPage({ id, go }: { id: string; go: (screen: Screen) => void }) {
  const plant = plants.find((p) => p.id === id);
  if (!plant)
    return <EmptyDetail title="Species not found" onBack={() => go({ name: "discover" })} />;
  return (
    <>
      <DetailImage
        image={plant.image}
        title={plant.name}
        onBack={() => go({ name: "discover" })}
        cover
      >
        <div
          className={
            "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg " +
            rarityClass[plant.rarity]
          }
        >
          {plant.rarity}
        </div>
      </DetailImage>
      <section className="relative z-10 -mt-8 flex-1 rounded-t-[3rem] bg-bone px-7 pb-12 pt-8 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.08)]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
          Field guide entry
        </span>
        <h1 className="mt-1 font-serif text-4xl font-bold leading-tight">{plant.name}</h1>
        <p className="mt-1 font-serif text-base italic text-moss">{plant.latin}</p>
        <p className="mt-7 text-sm leading-relaxed text-forest/80">{plant.notes}</p>
        <dl className="mt-8 divide-y divide-forest/5 border-y border-forest/5">
          <Row icon={Leaf} label="Habitat" value={plant.habitat} />
          <Row icon={MapPin} label="Sighted at" value={plant.foundAt} />
        </dl>
      </section>
    </>
  );
}

function BottomNav({ active, go }: { active: Screen["name"]; go: (screen: Screen) => void }) {
  const items = [
    { name: "field" as const, label: "Field", Icon: MapPin },
    { name: "herbarium" as const, label: "Herbarium", Icon: Leaf },
    { name: "capture" as const, label: "Capture", Icon: Camera },
    { name: "discover" as const, label: "Discover", Icon: Sparkles },
  ];
  return (
    <nav className="mobile-dock-float pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3">
      <div className="liquid-glass pointer-events-auto grid w-full max-w-md grid-cols-4 items-center rounded-[1.55rem] p-1">
        {items.map(({ name, label, Icon }) => {
          const selected = active === name;
          const prominent = name === "capture";
          return (
            <button
              key={name}
              type="button"
              onClick={() => go({ name })}
              className="relative z-10 flex min-w-0 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 active:scale-95"
            >
              <span
                className={
                  "grid size-8 place-items-center rounded-xl transition " +
                  (prominent
                    ? "bg-forest/90 text-bone shadow-lg shadow-forest/20"
                    : selected
                      ? "bg-white/65 text-forest shadow-sm ring-1 ring-white/70"
                      : "text-moss/55")
                }
              >
                <Icon className="size-[1.15rem]" strokeWidth={1.75} />
              </span>
              <span
                className={
                  "max-w-full truncate text-[8px] font-semibold uppercase tracking-[0.12em] " +
                  (selected ? "text-forest" : "text-moss/50")
                }
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function PageHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <header className="mobile-safe-top px-6 pb-6">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
        {eyebrow}
      </span>
      <h1 className="font-serif text-4xl font-bold italic leading-tight">{title}</h1>
      <p className="mt-2 max-w-[34ch] text-sm text-moss/80">{copy}</p>
    </header>
  );
}

function Avatar({
  profile,
  size,
}: {
  profile: Pick<Profile, "displayName" | "avatarImage">;
  size: "sm" | "lg";
}) {
  const initials =
    profile.displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BF";
  const sizeClass =
    size === "lg" ? "size-24 rounded-[1.45rem] text-2xl" : "size-10 rounded-full text-sm";

  if (profile.avatarImage) {
    return (
      <span className={"block overflow-hidden bg-sage " + sizeClass}>
        <img src={profile.avatarImage} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={
        "grid place-items-center bg-forest font-serif font-bold italic text-bone " + sizeClass
      }
    >
      {initials}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <SmallStat label={label} value={String(value)} />;
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-forest/5 bg-bone p-3 text-center shadow-sm">
      <span className="block font-serif text-lg font-bold">{value}</span>
      <span className="block text-[9px] uppercase tracking-wider text-moss/60">{label}</span>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  serif = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  serif?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          "mt-2 w-full rounded-2xl border border-forest/10 bg-bone px-4 py-4 placeholder:text-moss/40 focus:border-gold focus:outline-none " +
          (serif ? "font-serif text-base italic" : "text-sm")
        }
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-moss/60">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-forest/10 bg-bone px-3 py-4 text-sm focus:border-gold focus:outline-none"
      >
        <option value="">Unknown</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Quest({
  title,
  detail,
  progress,
  total,
}: {
  title: string;
  detail: string;
  progress: number;
  total: number;
}) {
  const done = progress >= total;
  return (
    <div className="rounded-2xl bg-sage p-3">
      <div className="flex items-start gap-3">
        <CheckCircle2
          className={done ? "mt-0.5 size-5 text-gold" : "mt-0.5 size-5 text-moss/30"}
          strokeWidth={1.75}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            <span className="text-[10px] font-bold text-moss/60">
              {progress}/{total}
            </span>
          </div>
          <p className="mt-1 text-xs text-moss/70">{detail}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest/5">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailImage({
  image,
  title,
  onBack,
  cover = false,
  children,
}: {
  image: string;
  title: string;
  onBack: () => void;
  cover?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative bg-white">
      <img
        src={image}
        alt={title}
        className={"aspect-square w-full " + (cover ? "object-cover" : "object-contain p-8")}
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
        <button
          onClick={onBack}
          className="grid size-10 place-items-center rounded-full border border-forest/5 bg-bone/90 shadow-md backdrop-blur"
          aria-label="Back"
        >
          <X className="size-4 rotate-45 text-forest" />
        </button>
        {children}
      </div>
    </div>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Leaf;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-forest/5 bg-bone p-4">
      <Icon className="size-4 text-moss" strokeWidth={1.75} />
      <span className="mt-3 block text-[9px] uppercase tracking-widest text-moss/60">{label}</span>
      <span className="mt-1 block text-sm font-semibold leading-tight">{value}</span>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Leaf; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-moss" strokeWidth={1.75} />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-moss/70">
          {label}
        </span>
      </div>
      <span className="max-w-[60%] text-right text-sm font-medium text-forest">{value}</span>
    </div>
  );
}

function EmptyDetail({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <main className="grid flex-1 place-items-center px-8 text-center">
      <div>
        <p className="font-serif text-2xl font-bold italic">{title}</p>
        <button
          onClick={onBack}
          className="mt-6 rounded-2xl bg-forest px-5 py-3 text-xs font-semibold uppercase tracking-wider text-bone"
        >
          Go back
        </button>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
