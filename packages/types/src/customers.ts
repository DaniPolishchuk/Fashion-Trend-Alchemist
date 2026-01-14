/**
 * Customer domain types
 * Represents customer entities and their attributes
 */

/**
 * Customer entity from the customers table
 */
export interface Customer {
  customerId: string;
  fn: string | null;
  active: boolean | null;
  clubMemberStatus: string | null;
  fashionNewsFrequency: string | null;
  age: number | null;
  postalCode: string | null;
}