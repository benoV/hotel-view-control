export type SiteId = "booking" | "agoda";
export type VisibilityState = "hidden" | "dimmed";

export interface HotelPreference {
  site: SiteId;
  hotelId: string;
  hotelName: string;
  canonicalUrl?: string;
  state: VisibilityState;
  updatedAt: number;
}

export type PreferenceMap = Record<string, HotelPreference>;

export interface HotelCard {
  element: HTMLElement;
  hotelId: string;
  hotelName: string;
  canonicalUrl?: string;
  /** A site-specific, visible region where the extension control should be mounted. */
  controlHost?: HTMLElement;
}
