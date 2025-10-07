import type { Photo, Section } from '../shared';

export interface Brand {
  /**
   * [WEB] Brand name.
   */
  name: string;

  /**
   * [WEB] Brand logo.
   *
   * **Height**: 120px
   */
  img: Photo;

  /**
   * [WEB] URL to brand's website or related page.
   */
  url?: string;
}

export interface BrandsSection extends Section {
  /**
   * [WEB] List of brands you worked with.
   */
  items: Brand[];
}
