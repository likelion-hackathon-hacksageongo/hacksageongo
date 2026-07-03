export type ListingCategory = "공모전" | "대외활동" | "인턴" | "채용" | "자격시험" | "운동";

export interface Listing {
  source: "linkareer" | "worknet" | "qnet" | "seoul_sports";
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
