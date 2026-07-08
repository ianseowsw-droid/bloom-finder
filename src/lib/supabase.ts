import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { SignInWithApple } from "@capacitor-community/apple-sign-in";
import type { Specimen } from "@/lib/collection";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

const SPECIMEN_BUCKET = "specimens";

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

export function isAppleSignInAvailable() {
  return Capacitor.getPlatform() === "ios" && Boolean(supabase);
}

export async function signInWithApple() {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { response } = await SignInWithApple.authorize({
    clientId: "com.floristar.bloomfinder",
    redirectURI: "",
    scopes: "email name",
  });

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: response.identityToken,
  });
  if (error) throw error;

  const givenName = [response.givenName, response.familyName].filter(Boolean).join(" ");
  return { givenName: givenName || null, email: response.email };
}

export async function getAuthenticatedUserId() {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return data.user?.id ?? null;
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? "image/png";
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return {
    blob: new Blob([bytes], { type: mime }),
    extension: mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png",
  };
}

async function uploadSpecimenImage(userId: string, specimen: Specimen) {
  if (!supabase) return specimen.imagePath ?? null;
  if (specimen.imagePath) return specimen.imagePath;

  const { blob, extension } = dataUrlToBlob(specimen.image);
  const imagePath = `${userId}/${specimen.id}.${extension}`;
  const { error } = await supabase.storage
    .from(SPECIMEN_BUCKET)
    .upload(imagePath, blob, {
      contentType: blob.type,
      upsert: true,
    });

  if (error) return null;
  return imagePath;
}

async function signedImageUrl(path: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(SPECIMEN_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function syncSpecimenToSupabase(specimen: Specimen) {
  if (!supabase) return { ok: false, reason: "Supabase is not configured." };
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, reason: "User is not authenticated." };

  const imagePath = await uploadSpecimenImage(userId, specimen);
  if (!imagePath) return { ok: false, reason: "Image upload failed." };

  const { error } = await supabase.from("specimens").upsert({
    id: specimen.id,
    owner_id: userId,
    name: specimen.name,
    latin: specimen.latin || null,
    notes: specimen.notes || null,
    image_path: imagePath,
    created_at_ms: specimen.createdAt,
    found_at: specimen.foundAt || null,
    habitat: specimen.habitat || null,
    color: specimen.color || null,
    confidence: specimen.confidence || null,
    tags: specimen.tags || [],
    latitude: specimen.latitude || null,
    longitude: specimen.longitude || null,
    location_accuracy_m: specimen.locationAccuracy || null,
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function deleteSpecimenFromSupabase(id: string) {
  if (!supabase) return;
  const userId = await getAuthenticatedUserId();
  if (!userId) return;

  const { data } = await supabase
    .from("specimens")
    .select("image_path")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();

  if (data?.image_path) {
    await supabase.storage.from(SPECIMEN_BUCKET).remove([data.image_path]);
  }

  await supabase.from("specimens").delete().eq("id", id).eq("owner_id", userId);
}

export async function fetchSupabaseSpecimens(): Promise<Specimen[]> {
  if (!supabase) return [];
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("specimens")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at_ms", { ascending: false });

  if (error || !data) return [];

  return Promise.all(
    data.map(async (row) => ({
      id: row.id,
      name: row.name,
      latin: row.latin ?? undefined,
      notes: row.notes ?? "",
      image: row.image_path ? (await signedImageUrl(row.image_path)) || "" : "",
      imagePath: row.image_path ?? undefined,
      createdAt: row.created_at_ms,
      foundAt: row.found_at ?? undefined,
      habitat: row.habitat ?? undefined,
      color: row.color ?? undefined,
      confidence: row.confidence ?? undefined,
      tags: row.tags ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      locationAccuracy: row.location_accuracy_m ?? undefined,
    })),
  );
}
