// Temporary client-side daily quota for free plant identifications.
// This is a soft limit only — it resets if the user clears app storage
// or reinstalls. Real enforcement (tied to the Supabase user + paid tier)
// should replace this once the subscription system is built.

const KEY = "floristar.quota.v1";
export const DAILY_FREE_LIMIT = 3;

type QuotaState = { date: string; count: number };

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function read(): QuotaState {
  if (typeof window === "undefined") return { date: todayKey(), count: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as QuotaState;
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function write(state: QuotaState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures (e.g. private browsing) — worst case the
    // limit doesn't persist, which is the safe failure direction for a
    // soft, non-critical quota.
  }
}

export function getRemainingToday(): number {
  return Math.max(0, DAILY_FREE_LIMIT - read().count);
}

export function hasQuotaRemaining(): boolean {
  return getRemainingToday() > 0;
}

// Call right before sending an identification request. Returns false
// (and does not consume a unit) if the daily limit is already reached.
export function consumeQuota(): boolean {
  const state = read();
  if (state.count >= DAILY_FREE_LIMIT) return false;
  write({ date: state.date, count: state.count + 1 });
  return true;
}
