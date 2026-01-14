/**
 * Transaction domain types
 * Represents purchase transactions from the transactions_train table
 */

/**
 * Transaction record representing a single purchase line item
 */
export interface Transaction {
  /** Transaction date (ISO format) */
  tDat: string;
  
  /** Customer identifier */
  customerId: string;
  
  /** Article identifier */
  articleId: number;
  
  /** Transaction price (net) */
  price: number;
  
  /** Sales channel identifier (1 or 2) */
  salesChannelId: number;
}