import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { collectionStats, timeAgo, useCollection } from "@/lib/collection";
import heroImg from "@/assets/hero-monstera.jpg";
import { Camera, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Florist.ar — Field" },
      {
        name: "description",
        content: "Photograph wildflowers and plants, press them into your digital herbarium.",
      },
    ],
  }),
  component: Field,
});

function Field() {
  const collection = useCollection();
  const recent = collection.slice(0, 6);
  const stats = collectionStats(collection);
  const nextGoal =
    collection.length < 3
      ? `${3 - collection.length} more to first set`
      : stats.habitats < 2
        ? "Record a new habitat"
        : "Field set complete";

  return (
    <AppShell>
      <nav className="px-6 pt-8 pb-4 flex justify-between items-center bg-sage/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
            Field Report
          </span>
          <h1 className="font-serif text-2xl font-bold italic">Florist.ar</h1>
        </div>
        <div className="size-10 rounded-full border border-forest/10 bg-bone grid place-items-center shadow-sm">
          <div className="size-2 rounded-full bg-gold animate-pulse" />
        </div>
      </nav>

      <main className="flex-1 px-4 py-2">
        <Link
          to="/capture"
          className="block relative rounded-3xl overflow-hidden shadow-2xl bg-stone-soft aspect-[3/4] group"
        >
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/20 via-forest/10 to-forest/85" />

          <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
            <div>
              <span className="bg-forest/80 backdrop-blur-md text-bone px-3 py-1.5 rounded-full text-xs font-medium border border-bone/20">
                Today's field
              </span>
            </div>

            <div className="bg-bone/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-forest/5">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
                Begin a new entry
              </span>
              <h2 className="font-serif text-2xl font-bold italic mt-1 leading-tight">
                Press a specimen
              </h2>
              <p className="mt-2 text-xs text-moss/80 leading-relaxed">
                Photograph any flower or plant. We lift it from its surroundings; you give
                it a name.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gold">
                  Tap to capture
                </span>
                <span className="size-9 rounded-full bg-forest grid place-items-center text-bone shadow-md">
                  <Camera className="size-4" strokeWidth={1.75} />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: "Specimens", value: String(collection.length) },
            {
              label: "Latest",
              value: collection[0] ? timeAgo(collection[0].createdAt) : "—",
            },
            { label: "Habitats", value: String(stats.habitats) },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-bone p-4 rounded-2xl border border-forest/5 shadow-sm text-center"
            >
              <span className="block text-[10px] uppercase tracking-wider text-moss/60 mb-1">
                {s.label}
              </span>
              <span className="font-serif text-sm font-bold">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-forest text-bone p-4 flex items-center gap-3">
          <CheckCircle2 className="size-5 text-gold" strokeWidth={1.75} />
          <div>
            <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-bone/60">
              Next field goal
            </span>
            <span className="block font-serif text-lg font-bold">{nextGoal}</span>
          </div>
        </div>
      </main>

      <section className="px-6 py-8 mt-4 bg-bone rounded-t-[3rem] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-serif text-2xl font-bold">Your Herbarium</h3>
          <Link
            to="/herbarium"
            className="text-xs font-bold text-gold uppercase tracking-widest"
          >
            View All
          </Link>
        </div>

        {recent.length === 0 ? (
          <Link
            to="/capture"
            className="block rounded-2xl border-2 border-dashed border-moss/30 p-8 text-center"
          >
            <p className="font-serif italic text-moss">No specimens yet.</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-gold">
              Press your first
            </p>
          </Link>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {recent.map((s) => (
              <Link
                key={s.id}
                to="/specimen/$id"
                params={{ id: s.id }}
                className="flex-shrink-0 w-32"
              >
                <div className="w-full aspect-square rounded-2xl bg-white border border-forest/5 mb-2 grid place-items-center overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <p className="text-sm font-semibold truncate">{s.name}</p>
                <p className="text-[10px] text-moss/60 uppercase tracking-tighter">
                  Pressed {timeAgo(s.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
