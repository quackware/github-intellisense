export interface CompletionList {
  /** The list (or partial list) of completion items. */
  items: string[];
  /** If the list is a partial list, and further queries to the endpoint will
   * change the items, set `isIncomplete` to `true`. */
  isIncomplete?: boolean;
  /** If one of the items in the list should be preselected (the default
   * suggestion), then set the value of `preselect` to the value of the item. */
  preselect?: string;
}

export interface DocumentationResponse {
  kind: "markdown" | "plaintext";
  value: string;
}

export type Index = Record<string, {
  items: IndexContent[];
  documentation?: string;
}>;

export interface IndexContent {
  type: "report" | "directory" | "file" | string;
  name: string;
  size: string;
  contents?: IndexContent[];
}
