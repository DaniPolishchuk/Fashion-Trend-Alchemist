/**
 * Help Dialog Component
 * Displays context-sensitive help information
 */

import {
  Dialog,
  Title,
  Text,
  Icon,
  List,
  ListItemStandard,
  Button,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/lightbulb.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import type { HelpContent } from '../constants/helpContent';
import styles from '../styles/components/HelpDialog.module.css';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  content: HelpContent | null;
}

function HelpDialog({ open, onClose, content }: HelpDialogProps) {
  if (!content) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      headerText={content.title}
      className={styles.dialog}
      footer={
        <div className={styles.footer}>
          <Button design="Emphasized" onClick={onClose}>
            Got it!
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        {/* Description */}
        <div className={styles.section}>
          <Text className={styles.description}>{content.description}</Text>
        </div>

        {/* Key Features */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon name="accept" className={styles.sectionIcon} />
            <Title level="H5" className={styles.sectionTitle}>
              Key Features
            </Title>
          </div>
          <List className={styles.list}>
            {content.features.map((feature, index) => (
              <ListItemStandard key={index} icon="less">
                {feature}
              </ListItemStandard>
            ))}
          </List>
        </div>

        {/* Tips */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon name="lightbulb" className={styles.sectionIcon} />
            <Title level="H5" className={styles.sectionTitle}>
              Tips & Tricks
            </Title>
          </div>
          <List className={styles.list}>
            {content.tips.map((tip, index) => (
              <ListItemStandard key={index} icon="less">
                {tip}
              </ListItemStandard>
            ))}
          </List>
        </div>
      </div>
    </Dialog>
  );
}

export default HelpDialog;
