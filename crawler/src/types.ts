export type ListingCategory = "공모전" | "대외활동" | "인턴" | "채용";

export interface Listing {
  source: "linkareer" | "worknet";
  sourceId: string;
  category: ListingCategory;
  title: string;
  organization: string;
  url: string;
  deadline: string | null; // ISO 8601, 상시모집 등은 null
  thumbnailUrl: string | null;
  viewCount: number | null;
  crawledAt: string; // ISO 8601
}
