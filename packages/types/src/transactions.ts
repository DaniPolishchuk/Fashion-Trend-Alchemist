/**
 * Transaction domain types
 * Represents purchase transactions from the transactions_train table
 */

/**
 * Transaction record representing a single purchase line item
 */
export interface Transaction {
  /** Transaction date */
  tDate: Date;
  
  /** Customer identifier */
  customerId: string;
  
  /** Article identifier */
  articleId: string;
  
  /** Transaction price */
  price: number;
}
