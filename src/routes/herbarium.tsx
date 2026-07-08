import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  collectionStats,
  specimenTags,
  timeAgo,
  useCollection,
} from "@/lib/collection";
import { Camera, CheckCircle2, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/herbarium")({
  head: () => ({
    meta: [
      { title: "Herbarium · Florist.ar" },
      {
        name: "description",
        content: "Every flower and plant you've pressed into your digital field journal.",
      },
    ],
  }),
  component: Herbarium,
});

function Herbarium() {
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
    const matchesSearch = haystack.includes(query.trim().toLowerCase());
    const matchesFilter = filter === "All" || specimenTags(s).includes(filter);
    return matchesSearch && matchesFilter;
  });
  const goals = [
    { label: "Press 3 specimens", done: collection.length >= 3 },
    { label: "Record 2 habitats", done: stats.habitats >= 2 },
    { label: "Identify one Latin name", done: stats.identified >= 1 },
  ];

  return (
    <AppShell>
      <header className="px-6 pt-10 pb-6">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
          Collection
        </span>
        <h1 className="font-serif text-4xl font-bold italic leading-tight">Herbarium</h1>
        <p className="mt-2 text-sm text-moss/80 max-w-[34ch]">
          {collection.length === 0
            ? "Your journal is empty. Press your first specimen to begin."
            : `${collection.length} specimen${collection.length === 1 ? "" : "s"} pressed into your journal.`}
        </p>
      </header>

      <main className="px-6 flex-1">
        {collection.length === 0 ? (
          <Link
            to="/capture"
            className="block rounded-3xl border-2 border-dashed border-moss/30 bg-bone/50 p-10 text-center"
          >
            <div className="size-14 mx-auto rounded-full bg-forest grid place-items-center text-bone shadow-lg shadow-forest/20">
              <Camera className="size-6" strokeWidth={1.75} />
            </div>
            <p className="mt-5 font-serif italic text-lg text-forest">
              Press your first specimen
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] font-semibold text-moss/60">
              Tap to capture
            </p>
          </Link>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Pressed" value={stats.specimens} />
              <Stat label="Habitats" value={stats.habitats} />
              <Stat label="Colors" value={stats.colors} />
              <Stat label="IDs" value={stats.identified} />
            </div>

            <section className="mt-5 rounded-2xl bg-bone border border-forest/5 p-4">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-moss" strokeWidth={1.75} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, place, notes"
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
                      "whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider border " +
                      (filter === f
                        ? "bg-forest text-bone border-forest"
                        : "bg-sage text-moss border-forest/5")
                    }
                  >
                    {f === "All" ? (
                      <span className="inline-flex items-center gap-1">
                        <Filter className="size-3" />
                        All
                      </span>
                    ) : (
                      f
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-2xl bg-forest text-bone p-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-bone/60">
                Field goals
              </span>
              <div className="mt-3 grid gap-2">
                {goals.map((goal) => (
                  <div key={goal.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={goal.done ? "size-4 text-gold" : "size-4 text-bone/30"}
                      strokeWidth={1.75}
                    />
                    <span className={goal.done ? "text-bone" : "text-bone/60"}>
                      {goal.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {filtered.length === 0 ? (
              <div className="mt-8 rounded-2xl border-2 border-dashed border-moss/30 p-8 text-center">
                <p className="font-serif italic text-moss">No matching specimens.</p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {filtered.map((s) => (
                  <Link
                    key={s.id}
                    to="/specimen/$id"
                    params={{ id: s.id }}
                    className="bg-bone rounded-2xl p-3 border border-forest/5 shadow-sm flex flex-col gap-3"
                  >
                    <div className="w-full aspect-square rounded-xl bg-white overflow-hidden grid place-items-center">
                      <img
                        src={s.image}
                        alt={s.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-moss/10 text-moss">
                        {s.color || "Pressed"}
                      </span>
                      <h4 className="font-serif text-base font-bold mt-1.5 leading-tight">
                        {s.name}
                      </h4>
                      <p className="text-[10px] italic text-moss/70 truncate">
                        {s.latin || s.habitat || timeAgo(s.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-bone border border-forest/5 p-3 text-center shadow-sm">
      <span className="block font-serif text-lg font-bold">{value}</span>
      <span className="block text-[9px] uppercase tracking-wider text-moss/60">
        {label}
      </span>
    </div>
  );
}
