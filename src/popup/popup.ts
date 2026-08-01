import { clearAll, clearSite, getPreferences, preferencesForSite, removePreference } from "../shared/storage";
import type { SiteId } from "../shared/types";

const list = document.querySelector<HTMLElement>("#preferences")!;
const siteLabel = document.querySelector<HTMLElement>("#site-label")!;
const clearSiteButton = document.querySelector<HTMLButtonElement>("#clear-site")!;
const clearAllButton = document.querySelector<HTMLButtonElement>("#clear-all")!;
let activeSite: SiteId | undefined;

function siteFromUrl(url?: string): SiteId | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    if (host.includes("booking.com")) return "booking";
    if (host.includes("agoda.com")) return "agoda";
  } catch { /* ignored */ }
  return undefined;
}

async function render(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeSite = siteFromUrl(tab?.url);
  const preferences = await getPreferences();
  const entries = activeSite ? preferencesForSite(preferences, activeSite) : [];
  siteLabel.textContent = activeSite ? `Saved hotels for ${activeSite === "booking" ? "Booking.com" : "Agoda"}.` : "Open Booking.com or Agoda to manage hotels.";
  clearSiteButton.hidden = !activeSite || entries.length === 0;
  list.replaceChildren();
  if (!activeSite) return;
  if (entries.length === 0) {
    list.innerHTML = '<p class="empty">No saved hotel visibility preferences for this site.</p>';
    return;
  }
  for (const entry of entries) {
    const row = document.createElement("article");
    row.className = "preference";
    const name = document.createElement("strong");
    name.textContent = entry.hotelName;
    const meta = document.createElement("span");
    meta.textContent = entry.state === "hidden" ? "Hidden" : "Dimmed";
    const restore = document.createElement("button");
    restore.className = "restore";
    restore.textContent = "Show";
    restore.addEventListener("click", async () => {
      await removePreference(entry.site, entry.hotelId);
      await render();
    });
    row.append(name, meta, restore);
    list.append(row);
  }
}

clearSiteButton.addEventListener("click", async () => {
  if (activeSite && confirm(`Clear all saved hotels for ${activeSite}?`)) { await clearSite(activeSite); await render(); }
});
clearAllButton.addEventListener("click", async () => {
  if (confirm("Clear all Hotel View Control preferences from this device?")) { await clearAll(); await render(); }
});
void render();
