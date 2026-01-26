/**
 * Enrichment Status Card Component
 * Reusable status display for idle, running, completed, and failed states
 */

import React from 'react';
import { Button, Icon, Text, ObjectStatus, ProgressIndicator } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/play.js';
import '@ui5/webcomponents-icons/dist/accept.js';

import { STATUS_CONFIGS, TEXT, type EnrichmentStatus } from '../constants/projectHub';
import styles from '../styles/pages/ProjectHub.module.css';

interface EnrichmentStatusCardProps {
  status: EnrichmentStatus;
  progress: { processed: number; total: number };
  projectStatus: 'draft' | 'active';
  completedAt?: string | null;
  onStart: () => void;
}

// Helper function to format completion date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const EnrichmentStatusCard: React.FC<EnrichmentStatusCardProps> = ({
  status,
  progress,
  projectStatus,
  completedAt,
  onStart,
}) => {
  const config = STATUS_CONFIGS[status];

  // Determine card variant class
  const cardVariantClass =
    status === 'idle'
      ? styles.statusCardIdle
      : status === 'running'
        ? styles.statusCardRunning
        : status === 'completed'
          ? styles.statusCardCompleted
          : styles.statusCardFailed;

  // Determine title color class
  const titleColorClass =
    status === 'idle'
      ? styles.statusCardTitleIdle
      : status === 'running'
        ? styles.statusCardTitleRunning
        : status === 'completed'
          ? styles.statusCardTitleCompleted
          : styles.statusCardTitleFailed;

  // Determine icon color class
  const iconColorClass =
    status === 'idle'
      ? styles.statusCardIconIdle
      : status === 'running'
        ? styles.statusCardIconRunning
        : status === 'completed'
          ? styles.statusCardIconCompleted
          : styles.statusCardIconFailed;

  // Generate status message
  const getMessage = () => {
    if (status === 'idle') {
      return projectStatus === 'active'
        ? TEXT.STATUS_MESSAGE.IDLE_ACTIVE
        : TEXT.STATUS_MESSAGE.IDLE_INACTIVE;
    }
    if (status === 'running') {
      return TEXT.STATUS_MESSAGE.RUNNING(progress.processed, progress.total);
    }
    if (status === 'completed') {
      const message = TEXT.STATUS_MESSAGE.COMPLETED(progress.total);
      return completedAt ? `${message} • ${formatDate(completedAt)}` : message;
    }
    if (status === 'failed') {
      return TEXT.STATUS_MESSAGE.FAILED(progress.processed, progress.total);
    }
    return '';
  };

  return (
    <div className={`${styles.statusCard} ${cardVariantClass}`}>
      {/* Button (for idle and failed states) */}
      {config.showButton && (
        <Button
          icon={config.icon || ''}
          design="Transparent"
          onClick={onStart}
          disabled={projectStatus !== 'active'}
          tooltip={config.buttonTooltip}
          className={styles.statusCardButton}
        >
          {config.buttonText}
        </Button>
      )}

      {/* Icon (for completed state) */}
      {!config.showButton && config.icon && (
        <Icon name={config.icon} className={`${styles.statusCardIcon} ${iconColorClass}`} />
      )}

      {/* Content */}
      <div className={styles.statusCardContent}>
        <div className={styles.statusCardHeader}>
          <Text className={`${styles.statusCardTitle} ${titleColorClass}`}>{config.title}</Text>
          <ObjectStatus state={config.state} inverted>
            {config.label}
          </ObjectStatus>
        </div>

        <Text
          className={
            config.showProgress ? styles.statusCardMessageWithMargin : styles.statusCardMessage
          }
        >
          {getMessage()}
        </Text>

        {/* Progress bar (for running state) */}
        {config.showProgress && (
          <ProgressIndicator
            value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}
            valueState="Information"
            className={styles.statusCardProgress}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(EnrichmentStatusCard);
