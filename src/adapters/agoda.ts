import type { HotelCard } from "../shared/types";
import type { SiteAdapter } from "./adapter";

export const agodaAdapter: SiteAdapter = {
  site: "agoda",

  hasPotentialCards(root: ParentNode): boolean {
    return root.querySelector("li[data-hotelid], [data-testid=\"maps-property-list\"] li[data-propertycard]") !== null;
  },

  findCards(root: ParentNode): HotelCard[] {
    /*
     * Map view is rendered in Agoda's overlay and leaves the ordinary result
     * list in the document behind it. Prefer the overlay while it exists so
     * controls only follow the cards the person can currently interact with.
     */
    const mapList = root.querySelector<HTMLElement>('[data-testid="maps-property-list"]');
    if (mapList) {
      return Array.from(mapList.querySelectorAll<HTMLElement>("li[data-propertycard]")).flatMap((element) => {
        const nameElement = element.querySelector<HTMLElement>('[data-selenium="mapsPropertyCard-name"]');
        const hotelId = nameElement?.dataset.propertyId?.trim() ?? element.dataset.propertycard?.trim();
        const hotelName = nameElement?.textContent?.trim();
        if (!hotelId || !hotelName) return [];
        return [{
          element,
          hotelId,
          hotelName,
          // Map cards are clickable buttons, so the control is mounted beside
          // that button on the list item rather than nested inside it.
          controlHost: element
        }];
      });
    }

    /*
     * Agoda search-result cards expose a stable internal property identifier:
     * <li data-hotelid="89989116">. Keep this as the canonical key and do not
     * replace it with a card index, price, or result order. Refine the title
     * selector below if a future Agoda markup capture exposes a dedicated name.
     */
    return Array.from(root.querySelectorAll<HTMLElement>("li[data-hotelid]")).flatMap((element) => {
      const hotelId = element.dataset.hotelid?.trim();
      const titleElement = element.querySelector<HTMLElement>('[data-testid="property-name-link"]');
      const hotelName = titleElement?.textContent?.trim();
      if (!hotelId || !hotelName) return [];
      const propertyLink = titleElement as HTMLAnchorElement;
      const gallery = element.querySelector<HTMLElement>(
        '[data-element-name="property-card-gallery"] > [role="region"][aria-roledescription="carousel"]'
      );
      return [{
        element,
        hotelId,
        hotelName,
        canonicalUrl: propertyLink.href ? `${location.origin}${new URL(propertyLink.href, location.href).pathname}` : undefined,
        // This is the image gallery's positioned carousel—not the outer card.
        controlHost: gallery ?? undefined
      }];
    });
  }
};
