import type { HotelCard, SiteId } from "../shared/types";

export interface SiteAdapter {
  readonly site: SiteId;
  findCards(root: ParentNode): HotelCard[];
}
