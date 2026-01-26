/**
 * FilterCardItem Component
 * Reusable filter card for attribute selection
 */

import { Icon, Text } from '@ui5/webcomponents-react';
import styles from '../styles/pages/ContextBuilder.module.css';

interface FilterCardItemProps {
  title: string;
  icon: string;
  selectedData: string[];
  onClick: () => void;
}

export function FilterCardItem({ title, icon, selectedData, onClick }: FilterCardItemProps) {
  const isSelected = selectedData.length > 0;

  return (
    <div
      onClick={onClick}
      className={`${styles.filterCardItem} ${isSelected ? styles.filterCardItemSelected : ''}`}
    >
      <div className={styles.filterCardItemHeader}>
        <Icon
          name={icon}
          className={isSelected ? styles.filterCardIconSelected : styles.filterCardIcon}
        />
        {isSelected && <span className={styles.filterCardBadge}>{selectedData.length}</span>}
      </div>
      <Text className={isSelected ? styles.filterCardTitleSelected : styles.filterCardTitle}>
        {title}
      </Text>
    </div>
  );
}
