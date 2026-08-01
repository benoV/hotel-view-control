import type { HotelCard, SiteId } from "../shared/types";

export interface SiteAdapter {
  readonly site: SiteId;
  hasPotentialCards(root: ParentNode): boolean;
  findCards(root: ParentNode): HotelCard[];
}
