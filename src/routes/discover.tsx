import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { plants, rarityClass } from "@/lib/plants";
import { useCollection } from "@/lib/collection";
import { Camera, CheckCircle2, ChevronRight, Info, MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover · Florist.ar" },
      { name: "description", content: "Rare blooms reported nearby — track them down before they fade." },
    ],
  }),
  component: Discover,
});

function Discover() {
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
      detail: "Save plants from different places like garden, forest, or roadside.",
      progress: Math.min(habitatCount, 2),
      total: 2,
    },
  ];

  return (
    <AppShell>
      <header className="px-6 pt-10 pb-6">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
          Field guide
        </span>
        <h1 className="font-serif text-4xl font-bold italic leading-tight">Discover</h1>
        <p className="mt-2 text-sm text-moss/80 max-w-[34ch]">
          Browse plants that may be nearby, then tap a card to learn what to look for.
        </p>
      </header>

      <main className="px-6 flex-1 space-y-5">
        <section className="rounded-3xl bg-bone border border-forest/5 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sage text-forest">
              <Info className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-serif text-xl font-bold">How this page works</h2>
              <p className="mt-1 text-sm leading-relaxed text-moss/80">
                These are sample plant sightings for the prototype. Use them as a field
                guide, or capture your own plant when you find one.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link
            to="/capture"
            className="rounded-2xl bg-forest p-4 text-bone shadow-lg shadow-forest/10"
          >
            <Camera className="size-5" strokeWidth={1.75} />
            <span className="mt-5 block text-[10px] uppercase tracking-[0.2em] text-bone/60">
              Found one?
            </span>
            <span className="mt-1 block font-serif text-xl font-bold">Capture it</span>
          </Link>
          <div className="rounded-2xl bg-bone border border-forest/5 p-4">
            <Search className="size-5 text-moss" strokeWidth={1.75} />
            <span className="mt-5 block text-[10px] uppercase tracking-[0.2em] text-moss/60">
              Nearby list
            </span>
            <span className="mt-1 block font-serif text-xl font-bold">
              {plants.length} plants
            </span>
          </div>
        </section>

        <section className="rounded-3xl bg-bone border border-forest/5 p-5 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
                Challenges
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold">Collection goals</h2>
            </div>
            <span className="text-xs font-bold text-gold">
              {quests.filter((q) => q.progress >= q.total).length}/{quests.length}
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {quests.map((quest) => {
              const done = quest.progress >= quest.total;
              return (
                <div key={quest.title} className="rounded-2xl bg-sage p-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className={done ? "mt-0.5 size-5 text-gold" : "mt-0.5 size-5 text-moss/30"}
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">{quest.title}</h3>
                        <span className="text-[10px] font-bold text-moss/60">
                          {quest.progress}/{quest.total}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-moss/70">{quest.detail}</p>
                      <div className="mt-3 h-1.5 rounded-full bg-forest/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold">Plants to look for</h2>
              <p className="mt-1 text-xs text-moss/70">
                Ordered by estimated distance from you.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {plants.map((p, i) => (
              <Link
                key={p.id}
                to="/species/$id"
                params={{ id: p.id }}
                className="flex items-center gap-4 bg-bone rounded-2xl p-3 border border-forest/5 shadow-sm"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  width={640}
                  height={640}
                  className="size-20 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={
                        "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded " +
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
                  <h3 className="font-serif text-lg font-bold truncate leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-[11px] italic text-moss/70 truncate">{p.latin}</p>
                  <p className="mt-1 text-xs text-moss/80 truncate">{p.habitat}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-moss/40" strokeWidth={1.75} />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
