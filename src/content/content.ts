import { agodaAdapter } from "../adapters/agoda";
import { bookingAdapter } from "../adapters/booking";
import type { SiteAdapter } from "../adapters/adapter";
import { getPreferences, preferenceKey, removePreference, setPreference } from "../shared/storage";
import type { HotelCard, PreferenceMap, VisibilityState } from "../shared/types";

const CONTROL_ATTRIBUTE = "data-hvc-control";
const adapter: SiteAdapter | undefined = location.hostname.includes("booking.com")
  ? bookingAdapter
  : location.hostname.includes("agoda.com")
    ? agodaAdapter
    : undefined;

let preferences: PreferenceMap = {};
let scanTimer: number | undefined;
let showHidden = false;
let sidePanel: HTMLElement | undefined;

function debounceScan(): void {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => void scan(), 120);
}

function applyState(card: HotelCard): void {
  const key = preferenceKey(adapter!.site, card.hotelId);
  const state = preferences[key]?.state;
  card.element.classList.toggle("hvc-card-hidden", state === "hidden");
  card.element.classList.toggle("hvc-card-dimmed", state === "dimmed");
  card.element.dataset.hvcState = state ?? "visible";
  const trigger = card.element.querySelector<HTMLButtonElement>("[data-hvc-trigger]");
  if (trigger) trigger.textContent = state === "dimmed" ? "Dimmed" : state === "hidden" ? "Hidden" : "Hide";
}

function closeMenus(except?: HTMLElement): void {
  document.querySelectorAll<HTMLElement>(".hvc-menu:not([hidden])").forEach((menu) => {
    if (menu !== except) menu.hidden = true;
  });
}

function showToast(message: string): void {
  let toast = document.querySelector<HTMLElement>("#hvc-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "hvc-toast";
    toast.className = "hvc-toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("hvc-toast-visible");
  window.setTimeout(() => toast?.classList.remove("hvc-toast-visible"), 1800);
}

async function changeState(card: HotelCard, state?: VisibilityState): Promise<void> {
  if (state) {
    await setPreference({ site: adapter!.site, hotelId: card.hotelId, hotelName: card.hotelName, canonicalUrl: card.canonicalUrl }, state);
    showToast(`${card.hotelName} ${state === "hidden" ? "hidden" : "dimmed"}.`);
  } else {
    await removePreference(adapter!.site, card.hotelId);
    showToast(`${card.hotelName} is visible again.`);
  }
  preferences = await getPreferences();
  applyState(card);
}

function createControl(card: HotelCard): HTMLElement {
  const control = document.createElement("div");
  control.className = `hvc-control hvc-control--${adapter!.site}`;
  control.setAttribute(CONTROL_ATTRIBUTE, "");
  control.innerHTML = `
    <button type="button" class="hvc-trigger" data-hvc-trigger aria-haspopup="menu" aria-expanded="false">Hide</button>
    <div class="hvc-menu" data-hvc-menu role="menu" hidden>
      <div class="hvc-menu-label">Hotel View Control</div>
      <button type="button" role="menuitem" data-hvc-action="hidden">Hide</button>
      <button type="button" role="menuitem" data-hvc-action="dimmed">Dim</button>
      <button type="button" role="menuitem" data-hvc-action="visible">Show</button>
    </div>`;

  const trigger = control.querySelector<HTMLButtonElement>("[data-hvc-trigger]")!;
  const menu = control.querySelector<HTMLElement>("[data-hvc-menu]")!;
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const opening = menu.hidden;
    closeMenus(menu);
    menu.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
  });
  control.addEventListener("click", async (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("[data-hvc-action]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    await changeState(card, button.dataset.hvcAction === "visible" ? undefined : button.dataset.hvcAction as VisibilityState);
  });
  return control;
}

function scan(): void {
  if (!adapter) return;
  for (const card of adapter.findCards(document)) {
    if (!card.element.querySelector(`[${CONTROL_ATTRIBUTE}]`)) {
      const host = card.controlHost ?? card.element;
      const position = getComputedStyle(host).position;
      if (position === "static") host.classList.add("hvc-control-host");
      host.append(createControl(card));
    }
    applyState(card);
  }
}

function addHiddenToggle(): void {
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "hvc-hidden-toggle";
  toggle.textContent = "Show hidden hotels";
  toggle.addEventListener("click", () => {
    showHidden = !showHidden;
    document.documentElement.classList.toggle("hvc-show-hidden", showHidden);
    toggle.textContent = showHidden ? "Hide restored hotels" : "Show hidden hotels";
  });
  document.body.append(toggle);
}

async function renderSidePanel(): Promise<void> {
  if (!sidePanel || !adapter) return;
  preferences = await getPreferences();
  const list = sidePanel.querySelector<HTMLElement>("[data-hvc-panel-list]")!;
  const siteName = adapter.site === "booking" ? "Booking.com" : "Agoda";
  list.replaceChildren();
  const entries = Object.values(preferences)
    .filter((preference) => preference.site === adapter.site)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hvc-panel-empty";
    empty.textContent = `No saved hotels for ${siteName}.`;
    list.append(empty);
    return;
  }
  for (const entry of entries) {
    const row = document.createElement("article");
    row.className = "hvc-panel-row";
    const name = document.createElement("strong");
    name.textContent = entry.hotelName;
    const state = document.createElement("span");
    state.textContent = entry.state === "hidden" ? "Hidden" : "Dimmed";
    const restore = document.createElement("button");
    restore.type = "button";
    restore.textContent = "Show";
    restore.addEventListener("click", async () => {
      await removePreference(entry.site, entry.hotelId);
      await renderSidePanel();
    });
    row.append(name, state, restore);
    list.append(row);
  }
}

function createSidePanel(): HTMLElement {
  const panel = document.createElement("aside");
  panel.className = "hvc-side-panel";
  panel.setAttribute("aria-label", "Hotel View Control");
  panel.innerHTML = `
    <header class="hvc-panel-header">
      <div><p>LOCAL HOTEL PREFERENCES</p><h2>Hotel View Control</h2><span>${adapter!.site === "booking" ? "Booking.com" : "Agoda"}</span></div>
      <button type="button" class="hvc-panel-close" aria-label="Close Hotel View Control">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19" /></svg>
      </button>
    </header>
    <section data-hvc-panel-list class="hvc-panel-list" aria-live="polite"></section>
    <div class="hvc-panel-actions">
      <button type="button" data-hvc-clear-site>Clear this site</button>
      <button type="button" data-hvc-clear-all class="hvc-panel-danger">Clear all</button>
    </div>
    <footer>By King Tide Media · Preferences stay on this device.</footer>`;
  panel.querySelector<HTMLButtonElement>(".hvc-panel-close")!.addEventListener("click", () => {
    panel.classList.remove("hvc-side-panel-open");
  });
  panel.querySelector<HTMLButtonElement>("[data-hvc-clear-site]")!.addEventListener("click", async () => {
    if (confirm("Clear all saved hotels for this site?")) {
      const { clearSite } = await import("../shared/storage");
      await clearSite(adapter!.site);
      await renderSidePanel();
    }
  });
  panel.querySelector<HTMLButtonElement>("[data-hvc-clear-all]")!.addEventListener("click", async () => {
    if (confirm("Clear all Hotel View Control preferences from this device?")) {
      const { clearAll } = await import("../shared/storage");
      await clearAll();
      await renderSidePanel();
    }
  });
  document.body.append(panel);
  return panel;
}

function toggleSidePanel(): void {
  sidePanel ??= createSidePanel();
  sidePanel.classList.toggle("hvc-side-panel-open");
  if (sidePanel.classList.contains("hvc-side-panel-open")) void renderSidePanel();
}

async function start(): Promise<void> {
  if (!adapter) return;
  preferences = await getPreferences();
  addHiddenToggle();
  scan();
  new MutationObserver(debounceScan).observe(document.body, { childList: true, subtree: true });
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== "local") return;
    void getPreferences().then((next) => { preferences = next; scan(); });
  });
  document.addEventListener("click", () => closeMenus());
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "hvc:toggle-panel") toggleSidePanel();
  });
}

void start();
