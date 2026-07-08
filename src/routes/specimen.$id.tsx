import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Calendar, Leaf, MapPin, Sparkles, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  deleteSpecimen,
  getSpecimen,
  specimenTags,
  timeAgo,
  type Specimen,
} from "@/lib/collection";
import { plants } from "@/lib/plants";

export const Route = createFileRoute("/specimen/$id")({
  head: () => ({
    meta: [
      { title: "Specimen · Florist.ar" },
      { name: "description", content: "A pressed specimen from your herbarium." },
    ],
  }),
  component: SpecimenPage,
});

function SpecimenPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [specimen, setSpecimen] = useState<Specimen | null | undefined>(undefined);

  useEffect(() => {
    setSpecimen(getSpecimen(id) ?? null);
  }, [id]);

  if (specimen === undefined) {
    return (
      <AppShell>
        <div className="p-10 text-center font-serif italic text-moss">Opening journal…</div>
      </AppShell>
    );
  }

  if (specimen === null) {
    return (
      <AppShell>
        <div className="p-10 text-center font-serif italic text-moss">
          Specimen not in your herbarium.
        </div>
        <div className="text-center">
          <Link
            to="/herbarium"
            className="inline-block bg-forest text-bone px-5 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider"
          >
            Back to herbarium
          </Link>
        </div>
      </AppShell>
    );
  }

  function remove() {
    if (!specimen) return;
    if (confirm(`Remove "${specimen.name}" from your herbarium?`)) {
      deleteSpecimen(specimen.id);
      navigate({ to: "/herbarium" });
    }
  }

  return (
    <AppShell>
      <div className="relative bg-white">
        <img
          src={specimen.image}
          alt={specimen.name}
          className="w-full aspect-square object-contain p-8"
        />
        <div className="absolute inset-x-0 top-0 p-5 flex justify-between items-start">
          <Link
            to="/herbarium"
            className="size-10 rounded-full bg-bone/90 backdrop-blur grid place-items-center shadow-md border border-forest/5"
            aria-label="Back"
          >
            <ArrowLeft className="size-4 text-forest" />
          </Link>
          <button
            onClick={remove}
            className="size-10 rounded-full bg-bone/90 backdrop-blur grid place-items-center shadow-md border border-forest/5"
            aria-label="Delete specimen"
          >
            <Trash2 className="size-4 text-forest" />
          </button>
        </div>
      </div>

      <section className="-mt-8 relative z-10 bg-sage rounded-t-[3rem] flex-1 px-7 pt-8 pb-12">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
          Personal specimen
        </span>
        <h1 className="font-serif text-4xl font-bold italic leading-tight mt-1">
          {specimen.name}
        </h1>
        {specimen.latin && (
          <p className="mt-1 font-serif italic text-base text-moss">{specimen.latin}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Info icon={Calendar} label="Pressed" value={timeAgo(specimen.createdAt)} />
          <Info
            icon={Sparkles}
            label="Confidence"
            value={specimen.confidence ? `${specimen.confidence}%` : "Manual"}
          />
          <Info icon={MapPin} label="Found at" value={specimen.foundAt || "Not recorded"} />
          <Info icon={Leaf} label="Habitat" value={specimen.habitat || "Unknown"} />
        </div>

        {specimen.latitude != null && specimen.longitude != null && (
          <a
            href={`https://maps.google.com/?q=${specimen.latitude},${specimen.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-between rounded-2xl bg-forest p-4 text-bone"
          >
            <span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-bone/60">
                GPS point
              </span>
              <span className="mt-1 block text-sm font-semibold">
                {specimen.latitude.toFixed(5)}, {specimen.longitude.toFixed(5)}
              </span>
            </span>
            <MapPin className="size-5 text-gold" strokeWidth={1.75} />
          </a>
        )}

        {specimenTags(specimen).length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {specimenTags(specimen).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-bone border border-forest/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-moss"
              >
                <Tag className="size-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {specimen.notes ? (
          <p className="mt-7 text-sm leading-relaxed text-forest/80 whitespace-pre-wrap">
            {specimen.notes}
          </p>
        ) : (
          <p className="mt-7 text-sm italic text-moss/50">No field notes recorded.</p>
        )}

        <section className="mt-8 rounded-2xl bg-bone border border-forest/5 p-5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-moss/60">
            Similar field guide entries
          </span>
          <div className="mt-4 grid gap-3">
            {plants.slice(0, 2).map((plant) => (
              <Link
                key={plant.id}
                to="/species/$id"
                params={{ id: plant.id }}
                className="flex items-center gap-3"
              >
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="size-14 rounded-xl object-cover"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{plant.name}</span>
                  <span className="block text-[11px] italic text-moss/70 truncate">
                    {plant.latin}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <Link
          to="/capture"
          className="mt-10 block text-center bg-forest text-bone py-4 rounded-2xl font-semibold text-sm tracking-wider uppercase shadow-lg shadow-forest/20"
        >
          Press another
        </Link>
      </section>
    </AppShell>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-bone border border-forest/5 p-4">
      <Icon className="size-4 text-moss" strokeWidth={1.75} />
      <span className="mt-3 block text-[9px] uppercase tracking-widest text-moss/60">
        {label}
      </span>
      <span className="mt-1 block text-sm font-semibold leading-tight">{value}</span>
    </div>
  );
}
