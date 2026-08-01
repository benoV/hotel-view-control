import type { HotelCard } from "../shared/types";
import type { SiteAdapter } from "./adapter";

export const agodaAdapter: SiteAdapter = {
  site: "agoda",

  findCards(root: ParentNode): HotelCard[] {
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
