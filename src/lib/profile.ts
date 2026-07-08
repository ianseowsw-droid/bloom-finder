import { getAuthenticatedUserId, supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  displayName: string;
  region: string;
  experience: string;
  shareLocation: boolean;
  avatarImage?: string;
  createdAt?: string;
};

const PROFILE_KEY = "floristar.profile.v1";

function readLocalProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

function writeLocalProfile(profile: Profile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<Profile | null> {
  const local = readLocalProfile();
  if (!supabase) return local;

  const userId = await getAuthenticatedUserId();
  if (!userId) return local;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return local;

  const profile: Profile = {
    id: data.id,
    displayName: data.display_name,
    region: data.region ?? "",
    experience: data.experience ?? "New naturalist",
    shareLocation: Boolean(data.share_location),
    avatarImage: local?.avatarImage,
    createdAt: data.created_at,
  };
  writeLocalProfile(profile);
  return profile;
}

export async function saveProfile(input: Omit<Profile, "id">): Promise<Profile> {
  const userId = (await getAuthenticatedUserId()) ?? crypto.randomUUID();
  const profile: Profile = { ...input, id: userId };
  writeLocalProfile(profile);

  if (supabase) {
    await supabase.from("profiles").upsert({
      id: userId,
      display_name: input.displayName,
      region: input.region,
      experience: input.experience,
      share_location: input.shareLocation,
    });
  }

  return profile;
}
