import type { HotelPreference, PreferenceMap, SiteId, VisibilityState } from "./types";

const STORAGE_KEY = "hotelViewControl.preferences.v1";
const CONSENT_KEY = "hotelViewControl.localDataConsent.v1";

export async function hasLocalDataConsent(): Promise<boolean> {
  const result = await chrome.storage.local.get(CONSENT_KEY);
  return result[CONSENT_KEY] === true;
}

export async function grantLocalDataConsent(): Promise<void> {
  await chrome.storage.local.set({ [CONSENT_KEY]: true });
}

export function preferenceKey(site: SiteId, hotelId: string): string {
  return `${site}:${hotelId}`;
}

export async function getPreferences(): Promise<PreferenceMap> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as PreferenceMap | undefined) ?? {};
}

async function save(preferences: PreferenceMap): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: preferences });
}

export async function setPreference(
  preference: Omit<HotelPreference, "state" | "updatedAt">,
  state: VisibilityState
): Promise<void> {
  const preferences = await getPreferences();
  const key = preferenceKey(preference.site, preference.hotelId);
  preferences[key] = { ...preference, state, updatedAt: Date.now() };
  await save(preferences);
}

export async function removePreference(site: SiteId, hotelId: string): Promise<void> {
  const preferences = await getPreferences();
  delete preferences[preferenceKey(site, hotelId)];
  await save(preferences);
}

export async function clearSite(site: SiteId): Promise<void> {
  const preferences = await getPreferences();
  for (const [key, preference] of Object.entries(preferences)) {
    if (preference.site === site) delete preferences[key];
  }
  await save(preferences);
}

export async function clearAll(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}

export function preferencesForSite(preferences: PreferenceMap, site: SiteId): HotelPreference[] {
  return Object.values(preferences)
    .filter((preference) => preference.site === site)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
