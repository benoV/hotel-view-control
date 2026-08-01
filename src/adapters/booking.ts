import type { HotelCard } from "../shared/types";
import type { SiteAdapter } from "./adapter";

function canonicalize(url: string): string | undefined {
  try {
    const parsed = new URL(url, location.href);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return undefined;
  }
}

export const bookingAdapter: SiteAdapter = {
  site: "booking",

  hasPotentialCards(root: ParentNode): boolean {
    return root.querySelector('[data-testid="property-card"]') !== null;
  },

  findCards(root: ParentNode): HotelCard[] {
    return Array.from(root.querySelectorAll<HTMLElement>(
      '[data-testid="property-card"]'
    )).flatMap((element) => {
      const titleLink = element.querySelector<HTMLAnchorElement>(
        '[data-testid="title-link"][href], [data-testid="title"][href]'
      );
      const canonicalUrl = titleLink ? canonicalize(titleLink.href) : undefined;
      // Some Booking layouts provide data-id; newer cards do not. The canonical
      // property URL is the approved stable fallback when the internal ID is absent.
      const hotelId = element.dataset.id?.trim() || canonicalUrl;
      const hotelName = titleLink?.querySelector('[data-testid="title"]')?.textContent?.trim()
        || titleLink?.textContent?.trim();

      // Do not substitute result position, search parameters, or all_sr_blocks values here.
      if (!hotelId || !hotelName) return [];

      const imageLink = element.querySelector<HTMLAnchorElement>(
        '[data-testid="property-card-desktop-single-image"]'
      );
      // Mount beside the single image rather than inside its anchor (which would
      // create an invalid interactive element nested in a link).
      const controlHost = imageLink?.parentElement ?? undefined;
      return [{ element, hotelId, hotelName, canonicalUrl, controlHost }];
    });
  }
};
