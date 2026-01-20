/**
 * Collection-related types
 * Used for displaying collections on the home page
 */

/**
 * Collection display item for the home page grid
 */
export interface CollectionListItem {
  id: string;
  name: string;
  itemCount: number;
  imageUrls: string[]; // Up to 4 URLs for thumbnail grid
}
