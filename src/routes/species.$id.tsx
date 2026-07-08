import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { plants, rarityClass, type Plant } from "@/lib/plants";
import { ArrowLeft, MapPin, Leaf, Calendar, Share2 } from "lucide-react";

export const Route = createFileRoute("/species/$id")({
  loader: ({ params }) => {
    const plant = plants.find((p) => p.id === params.id);
    if (!plant) throw notFound();
    return { plant };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.plant.name} · Florist.ar` },
          { name: "description", content: `${loaderData.plant.name} (${loaderData.plant.latin}) — ${loaderData.plant.notes}` },
          { property: "og:title", content: `${loaderData.plant.name} · Florist.ar` },
          { property: "og:description", content: loaderData.plant.notes },
          { property: "og:image", content: loaderData.plant.image },
        ]
      : [],
  }),
  component: SpeciesPage,
  notFoundComponent: () => (
    <AppShell>
      <div className="p-10 text-center font-serif italic text-moss">
        Species not in your field guide.
      </div>
    </AppShell>
  ),
});

function SpeciesPage() {
  const { plant } = Route.useLoaderData() as { plant: Plant };

  async function sharePlant() {
    const text = `${plant.name} (${plant.latin})\n${plant.notes}`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({
        title: `${plant.name} · Florist.ar`,
        text,
        url,
      });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Specimen link copied.");
  }

  return (
    <AppShell>
      <div className="relative">
        <img
          src={plant.image}
          alt={plant.name}
          width={1024}
          height={1024}
          className="w-full aspect-square object-cover"
        />
        <div className="absolute inset-x-0 top-0 p-5 flex justify-between items-start">
          <Link
            to="/herbarium"
            className="size-10 rounded-full bg-bone/90 backdrop-blur grid place-items-center shadow-md border border-forest/5"
            aria-label="Back"
          >
            <ArrowLeft className="size-4 text-forest" />
          </Link>
          <div className={"px-3 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider " + rarityClass[plant.rarity]}>
            {plant.rarity}
          </div>
        </div>
      </div>

      <section className="-mt-8 relative z-10 bg-bone rounded-t-[3rem] flex-1 px-7 pt-8 pb-12 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.08)]">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
          Specimen №{plant.id.length.toString().padStart(3, "0")}
        </span>
        <h1 className="font-serif text-4xl font-bold leading-tight mt-1">{plant.name}</h1>
        <p className="font-serif italic text-moss text-base mt-1">{plant.latin}</p>

        <div className="mt-6 flex items-center gap-3" aria-label="Guide completeness">
          <span className="text-xs font-bold text-moss bg-moss/10 px-2.5 py-1 rounded">
            Guide level {plant.level}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-forest/5 overflow-hidden">
            <div className="h-full bg-moss rounded-full" style={{ width: `${plant.xp}%` }} />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-moss/60">
            {plant.xp}% complete
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-moss/70">
          Guide level is prototype field-guide data. Later this can become your personal
          mastery level based on how often you identify, photograph, and annotate this species.
        </p>

        <p className="mt-7 text-sm leading-relaxed text-forest/80">{plant.notes}</p>

        <dl className="mt-8 divide-y divide-forest/5 border-y border-forest/5">
          <Row icon={Leaf} label="Habitat" value={plant.habitat} />
          <Row icon={MapPin} label="Sighted at" value={plant.foundAt} />
          <Row icon={Calendar} label="Pressed" value={plant.caughtAgo} />
        </dl>

        <button
          type="button"
          onClick={() => void sharePlant()}
          className="mt-10 w-full bg-forest text-bone py-4 rounded-2xl font-semibold text-sm tracking-wider uppercase shadow-lg shadow-forest/20 active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
        >
          <Share2 className="size-4" strokeWidth={1.75} />
          Share Specimen
        </button>
      </section>
    </AppShell>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Leaf; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-moss" strokeWidth={1.75} />
        <span className="text-[11px] uppercase tracking-widest font-semibold text-moss/70">
          {label}
        </span>
      </div>
      <span className="text-sm font-medium text-forest text-right max-w-[60%]">{value}</span>
    </div>
  );
}
