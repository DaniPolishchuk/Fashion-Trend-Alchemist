/**
 * Model Profile Configuration
 * Maps customer segments to model characteristics
 */

// ==================== TYPES ====================

export interface ModelProfile {
  gender: 'male' | 'female' | 'unspecified';
  ageGroup: 'child' | 'adult';
  descriptor: string;
}

// ==================== MAPPINGS ====================

/**
 * Maps customer segments to model profiles
 */
export const SEGMENT_TO_MODEL_PROFILE: Record<string, ModelProfile> = {
  'Baby/Children': {
    gender: 'unspecified',
    ageGroup: 'child',
    descriptor: 'a child model',
  },
  Divided: {
    gender: 'unspecified',
    ageGroup: 'adult',
    descriptor: 'an adult model',
  },
  Ladieswear: {
    gender: 'female',
    ageGroup: 'adult',
    descriptor: 'an adult female model',
  },
  Menswear: {
    gender: 'male',
    ageGroup: 'adult',
    descriptor: 'an adult male model',
  },
  Sport: {
    gender: 'unspecified',
    ageGroup: 'adult',
    descriptor: 'an adult model',
  },
};

/**
 * Default model profile when segment is unknown or null
 */
export const DEFAULT_MODEL_PROFILE: ModelProfile = {
  gender: 'unspecified',
  ageGroup: 'adult',
  descriptor: 'an adult model',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get model profile from customer segment
 * Falls back to default profile if segment is unknown
 *
 * IMPORTANT: Only exact matches are used. Child models are ONLY assigned
 * when customer segment is explicitly "Baby/Children"
 */
export function getModelProfile(customerSegment: string | null): ModelProfile {
  if (!customerSegment) {
    return DEFAULT_MODEL_PROFILE;
  }

  // Try exact match only - no partial matching to avoid false positives
  if (SEGMENT_TO_MODEL_PROFILE[customerSegment]) {
    return SEGMENT_TO_MODEL_PROFILE[customerSegment];
  }

  // No fallback matching - return default adult profile for unknown segments
  console.warn(
    `[ModelProfile] Unknown customer segment: "${customerSegment}", defaulting to adult model`
  );
  return DEFAULT_MODEL_PROFILE;
}
