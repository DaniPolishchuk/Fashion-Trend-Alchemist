/**
 * Velocity Recalculation Indicator Component
 * Shows warning when velocity scores are stale and allows triggering recalculation
 */

import React, { useState } from 'react';
import { Button, Icon, Text, ObjectStatus, BusyIndicator } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/synchronize.js';

import { API_ENDPOINTS } from '../constants/projectHub';
import { fetchAPI } from '../services/api/client';
import styles from '../styles/pages/ProjectHub.module.css';

interface VelocityRecalcIndicatorProps {
  projectId: string;
  isStale: boolean;
  onRecalculated: () => void;
}

const VelocityRecalcIndicator: React.FC<VelocityRecalcIndicatorProps> = ({
  projectId,
  isStale,
  onRecalculated,
}) => {
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Don't render if not stale
  if (!isStale) {
    return null;
  }

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await fetchAPI(API_ENDPOINTS.RECALCULATE_VELOCITY(projectId), {
        method: 'POST',
        body: JSON.stringify({}),
      });
      onRecalculated();
    } catch (error) {
      console.error('Failed to recalculate velocity scores:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className={styles.velocityRecalcIndicator}>
      {/* Icon or loading */}
      {isRecalculating ? (
        <BusyIndicator active size="S" />
      ) : (
        <Icon name="synchronize" className={`${styles.statusCardIcon} ${styles.velocityRecalcIcon}`} />
      )}

      {/* Content */}
      <div className={styles.statusCardContent}>
        <div className={styles.statusCardHeader}>
          <Text className={`${styles.statusCardTitle} ${styles.velocityRecalcTitle}`}>
            Context changed
          </Text>
          <ObjectStatus state="Negative" inverted>
            STALE
          </ObjectStatus>
        </div>

        <Text className={styles.statusCardMessage}>
          Velocity scores need recalculation
        </Text>
      </div>

      {/* Button */}
      <Button
        design="Emphasized"
        onClick={handleRecalculate}
        disabled={isRecalculating}
      >
        {isRecalculating ? 'Recalculating...' : 'Recalculate'}
      </Button>
    </div>
  );
};

export default React.memo(VelocityRecalcIndicator);
