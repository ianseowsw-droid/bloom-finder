// User-collected specimens, persisted to localStorage.
import { useEffect, useState } from "react";
import {
  deleteSpecimenFromSupabase,
  fetchSupabaseSpecimens,
  syncSpecimenToSupabase,
} from "@/lib/supabase";

export type Specimen = {
  id: string;
  name: string;
  notes: string;
  image: string; // local data URL or signed Storage URL
  imagePath?: string;
  createdAt: number; // epoch ms
  foundAt?: string;
  latin?: string;
  habitat?: string;
  color?: string;
  confidence?: number;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
};

const KEY = "floristar.collection.v1";
const EVENT = "floristar:collection-changed";

function read(): Specimen[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Specimen[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: Specimen[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

function mergeSpecimens(local: Specimen[], remote: Specimen[]) {
  const byId = new Map<string, Specimen>();
  [...remote, ...local].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function addSpecimen(s: Omit<Specimen, "id" | "createdAt">): Specimen {
  const item: Specimen = {
    ...s,
    id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  write([item, ...read()]);
  void syncSpecimenToSupabase(item);
  return item;
}

export function collectionStats(items: Specimen[]) {
  const habitats = new Set(items.map((s) => s.habitat).filter(Boolean));
  const colors = new Set(items.map((s) => s.color).filter(Boolean));
  const named = items.filter((s) => s.latin).length;
  return {
    specimens: items.length,
    habitats: habitats.size,
    colors: colors.size,
    identified: named,
  };
}

export function specimenTags(specimen: Specimen): string[] {
  return [
    specimen.color,
    specimen.habitat,
    specimen.latitude != null && specimen.longitude != null ? "gps" : undefined,
    specimen.latin ? "identified" : undefined,
    ...(specimen.tags ?? []),
  ].filter(Boolean) as string[];
}

export function deleteSpecimen(id: string) {
  write(read().filter((s) => s.id !== id));
  void deleteSpecimenFromSupabase(id);
}

export function getSpecimen(id: string): Specimen | undefined {
  return read().find((s) => s.id === id);
}

export function useCollection(): Specimen[] {
  const [items, setItems] = useState<Specimen[]>([]);
  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    void fetchSupabaseSpecimens().then((remote) => {
      if (remote.length === 0) return;
      const merged = mergeSpecimens(read(), remote);
      write(merged);
      setItems(merged);
    });
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return items;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  const w = Math.floor(d / 7);
  return `${w} wk ago`;
}
