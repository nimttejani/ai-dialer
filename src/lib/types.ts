export type SortDirection = "asc" | "desc" | "none";

export interface SortCriterion {
  column: string;
  direction: SortDirection;
} 