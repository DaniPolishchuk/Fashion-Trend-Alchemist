/**
 * Customer domain types
 * Represents customer entities and their attributes
 */

/**
 * Customer entity from the customers table
 */
export interface Customer {
  customerId: string;
  age: number | null;
}
