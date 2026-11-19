export interface Artwork {
  id: number;
  title: string;
  artist: string;
  image_url: string;
  date: string | null;
  medium: string | null;
  is_public_domain: boolean;
}

export interface ArtworkDetail extends Artwork {
  description: string | null;
  place_of_origin: string | null;
  dimensions: string | null;
}

export interface ArtworkPage {
  data: Artwork[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface CollectionItem {
  id: number;
  artwork_id: number;
  title: string;
  artist: string;
  image_url: string;
  note: string | null;
  created_at: string;
}
