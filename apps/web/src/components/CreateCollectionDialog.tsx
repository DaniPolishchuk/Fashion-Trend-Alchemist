/**
 * Create Collection Dialog Component
 * Modal dialog for creating new collections
 */

import { useState } from 'react';
import { Dialog, Button, Input, Text, MessageStrip, BusyIndicator } from '@ui5/webcomponents-react';
import { api } from '../services/api';
import styles from '../styles/components/CreateCollectionDialog.module.css';

interface CreateCollectionDialogProps {
  open: boolean;
  onClose: () => void;
  onCollectionCreated?: (collection: { id: string; name: string; createdAt: string }) => void;
}

export default function CreateCollectionDialog({
  open,
  onClose,
  onCollectionCreated,
}: CreateCollectionDialogProps) {
  const [collectionName, setCollectionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!collectionName.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await api.collections.create(collectionName.trim());

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        onCollectionCreated?.(result.data);
        handleClose();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCollectionName('');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      headerText="Create New Collection"
      footer={
        <div className={styles.dialogFooter}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            design="Emphasized"
            onClick={handleSubmit}
            disabled={loading || !collectionName.trim()}
          >
            {loading ? (
              <>
                <BusyIndicator active size="S" className={styles.loadingSpinner} />
                Creating...
              </>
            ) : (
              'Create Collection'
            )}
          </Button>
        </div>
      }
    >
      <div className={styles.dialogContent}>
        {error && (
          <div className={styles.errorContainer}>
            <MessageStrip design="Negative" hideCloseButton>
              {error}
            </MessageStrip>
          </div>
        )}

        <div className={styles.formGroup}>
          <Text className={styles.label}>Collection Name</Text>
          <Input
            value={collectionName}
            onInput={(e: CustomEvent) => {
              setCollectionName((e.target as HTMLInputElement).value);
              if (error) setError(null); // Clear error when user starts typing
            }}
            onKeyDown={handleKeyPress}
            placeholder="Enter collection name..."
            disabled={loading}
            className={styles.input}
          />
        </div>

        <div className={styles.helpText}>
          <Text className={styles.helpTextContent}>
            Collections help you organize and group your generated designs for easy access.
          </Text>
        </div>
      </div>
    </Dialog>
  );
}
