/**
 * Result Overview Tab Types
 * Type definitions for generated designs overview
 */

export interface GeneratedImages {
  front: { url: string | null; status: string };
  back: { url: string | null; status: string };
  model: { url: string | null; status: string };
}

export interface GeneratedDesign {
  id: string;
  name: string;
  predictedAttributes: Record<string, string> | null;
  inputConstraints: Record<string, string> | null;
  generatedImageUrl: string | null;
  generatedImages?: GeneratedImages | null;
  createdAt?: string;
}

export interface ResultOverviewTabProps {
  projectId: string;
}

export interface DisplayInfo {
  givenText: string;
  predictedText: string;
}
