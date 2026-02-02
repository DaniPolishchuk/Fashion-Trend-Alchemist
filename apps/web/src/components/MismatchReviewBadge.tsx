/**
 * Mismatch Review Badge Component
 * Shows status of product type mismatch detection and allows opening review dialog
 */

import React from 'react';
import { Icon, Text, ObjectStatus } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/alert.js';
import '@ui5/webcomponents-icons/dist/accept.js';

import {
  MISMATCH_REVIEW_STATUS,
  MISMATCH_CONFIGS,
  type MismatchReviewStatus,
} from '../constants/projectHub';
import type { MismatchSummary } from '../types/enhancedTableTab';
import styles from '../styles/pages/ProjectHub.module.css';

interface MismatchReviewBadgeProps {
  mismatchSummary: MismatchSummary;
  onClick: () => void;
}

const MismatchReviewBadge: React.FC<MismatchReviewBadgeProps> = ({ mismatchSummary, onClick }) => {
  const { flaggedCount, excludedCount, reviewCompleted } = mismatchSummary;

  // Don't render if no flagged items
  if (flaggedCount === 0) {
    return null;
  }

  // Determine review status
  const status: MismatchReviewStatus = reviewCompleted
    ? MISMATCH_REVIEW_STATUS.REVIEWED
    : MISMATCH_REVIEW_STATUS.NEEDS_REVIEW;

  const config = MISMATCH_CONFIGS[status];

  // Determine card variant class
  const cardVariantClass =
    status === MISMATCH_REVIEW_STATUS.NEEDS_REVIEW
      ? styles.mismatchBadgeNeedsReview
      : styles.mismatchBadgeReviewed;

  // Determine title color class
  const titleColorClass =
    status === MISMATCH_REVIEW_STATUS.NEEDS_REVIEW
      ? styles.mismatchBadgeTitleNeedsReview
      : styles.mismatchBadgeTitleReviewed;

  // Determine icon color class
  const iconColorClass =
    status === MISMATCH_REVIEW_STATUS.NEEDS_REVIEW
      ? styles.mismatchBadgeIconNeedsReview
      : styles.mismatchBadgeIconReviewed;

  // Generate subtitle message
  const getMessage = () => {
    if (excludedCount > 0) {
      return `${excludedCount} of ${flaggedCount} excluded`;
    }
    return config.subtitle;
  };

  return (
    <div
      className={`${styles.statusCard} ${cardVariantClass} ${styles.clickable}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Icon */}
      <Icon name={config.icon} className={`${styles.statusCardIcon} ${iconColorClass}`} />

      {/* Content */}
      <div className={styles.statusCardContent}>
        <div className={styles.statusCardHeader}>
          <Text className={`${styles.statusCardTitle} ${titleColorClass}`}>
            {flaggedCount} {config.title}
          </Text>
          <ObjectStatus
            state={status === MISMATCH_REVIEW_STATUS.NEEDS_REVIEW ? 'Negative' : 'Positive'}
            inverted
          >
            {status === MISMATCH_REVIEW_STATUS.NEEDS_REVIEW ? 'REVIEW' : 'REVIEWED'}
          </ObjectStatus>
        </div>

        <Text className={styles.statusCardMessage}>{getMessage()}</Text>
      </div>
    </div>
  );
};

export default React.memo(MismatchReviewBadge);
