/**
 * Attribute Skeleton Loader Component
 * Optimized loading placeholders for attribute cards
 */

import React, { useMemo } from 'react';
import { Icon, Button } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/arrow-right.js';
import '@ui5/webcomponents-icons/dist/arrow-left.js';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/ai.js';

import { VARIANTS, ICONS, DEFAULTS } from '../constants/skeletonLoader';
import styles from '../styles/components/AttributeSkeletonLoader.module.css';

interface AttributeSkeletonLoaderProps {
  variant: 'locked' | 'ai' | 'notIncluded';
  count?: number;
}

// Memoized skeleton card component for better performance
const SkeletonCard = React.memo<{ variant: AttributeSkeletonLoaderProps['variant'] }>(
  ({ variant }) => {
    if (variant === VARIANTS.LOCKED) {
      return (
        <div className={styles.lockedCard}>
          <div className={styles.lockedHeader}>
            <div className={`${styles.shimmer} ${styles.lockedTitle}`} />
            <Button
              icon={ICONS.LOCKED.DELETE}
              design="Transparent"
              disabled
              className={styles.buttonCompact}
            />
          </div>
          <div className={styles.lockedBody}>
            <div className={`${styles.shimmer} ${styles.lockedInput}`} />
            <Button
              icon={ICONS.LOCKED.ARROW}
              design="Transparent"
              disabled
              className={styles.button}
            />
          </div>
        </div>
      );
    }

    if (variant === VARIANTS.AI) {
      return (
        <div className={styles.aiCard}>
          <Button
            icon={ICONS.AI.ARROW_LEFT}
            design="Transparent"
            disabled
            className={styles.button}
          />
          <div className={styles.aiContent}>
            <Icon name={ICONS.AI.ICON} className={styles.aiIcon} />
            <div className={`${styles.shimmer} ${styles.aiTitle}`} />
          </div>
          <Button
            icon={ICONS.AI.DELETE}
            design="Transparent"
            disabled
            className={styles.buttonCompact}
          />
        </div>
      );
    }

    // NOT_INCLUDED variant
    return (
      <div className={styles.notIncludedCard}>
        <Button
          icon={ICONS.NOT_INCLUDED.ADD}
          design="Transparent"
          disabled
          className={styles.button}
        />
        <div className={styles.notIncludedContent}>
          <div className={`${styles.shimmer} ${styles.notIncludedTitle}`} />
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

function AttributeSkeletonLoader({
  variant,
  count = DEFAULTS.COUNT,
}: AttributeSkeletonLoaderProps) {
  // Memoize skeleton items array
  const skeletonItems = useMemo(() => Array.from({ length: count }, (_, index) => index), [count]);

  const containerClassName =
    variant === VARIANTS.LOCKED
      ? `${styles.container} ${styles.containerLocked}`
      : `${styles.container} ${styles.containerDefault}`;

  return (
    <div className={containerClassName}>
      {skeletonItems.map((index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </div>
  );
}

export default AttributeSkeletonLoader;
