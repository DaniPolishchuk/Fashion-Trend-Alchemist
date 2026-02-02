import { useState, useEffect, useCallback } from 'react';
import {
  Popover,
  Button,
  Input,
  BusyIndicator,
  Text,
  Icon,
  MessageStrip,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/bookmark.js';
import '@ui5/webcomponents-icons/dist/search.js';

import { api } from '../services/api';
import type { CollectionListItem } from '@fashion/types';
import { TEXT } from '../constants/saveToCollectionPopover';
import styles from '../styles/components/SaveToCollectionPopover.module.css';

interface SaveToCollectionPopoverProps {
  open: boolean;
  opener?: string;
  designId: string;
  onClose: () => void;
  onSaved?: (collectionName: string, collectionId: string) => void;
}

function SaveToCollectionPopover({
  open,
  opener,
  designId,
  onClose,
  onSaved,
}: SaveToCollectionPopoverProps) {
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open && collections.length === 0) {
      fetchCollections();
    }
  }, [open]);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.collections.list();

      if (result.error) {
        setError(result.error);
      } else {
        setCollections(result.data || []);
      }
    } catch (err) {
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveToCollection = useCallback(
    async (collectionId: string, collectionName: string) => {
      try {
        setSaving(collectionId);
        setError(null);

        const result = await api.collections.addDesign(collectionId, designId);

        if (result.error) {
          setError(result.error);
        } else {
          onSaved?.(collectionName, collectionId);
          onClose();
        }
      } catch (err) {
        setError('Failed to save to collection');
      } finally {
        setSaving(null);
      }
    },
    [designId, onSaved, onClose]
  );

  const handleCreateNewCollection = useCallback(async () => {
    if (!newCollectionName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const createResult = await api.collections.create(newCollectionName.trim());

      if (createResult.error) {
        setError(createResult.error);
        return;
      }

      const newCollection = createResult.data;
      if (!newCollection) {
        setError('Failed to create collection');
        return;
      }

      const addResult = await api.collections.addDesign(newCollection.id, designId);

      if (addResult.error) {
        setError(addResult.error);
        return;
      }

      const newCollectionItem: CollectionListItem = {
        id: newCollection.id,
        name: newCollection.name,
        createdAt: newCollection.createdAt,
        itemCount: 1,
        imageUrls: [],
      };

      setCollections((prev) => [newCollectionItem, ...prev]);

      onSaved?.(newCollection.name, newCollection.id);
      onClose();
    } catch (err) {
      setError('Failed to create collection');
    } finally {
      setCreating(false);
    }
  }, [newCollectionName, designId, onSaved, onClose]);

  const handleShowCreateNew = useCallback(() => {
    setShowCreateNew(true);
    setNewCollectionName('');
  }, []);

  const handleCancelCreateNew = useCallback(() => {
    setShowCreateNew(false);
    setNewCollectionName('');
  }, []);

  const handleClose = useCallback(() => {
    setShowCreateNew(false);
    setNewCollectionName('');
    setSearchQuery('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleSearchInput = useCallback((e: CustomEvent) => {
    setSearchQuery((e.target as HTMLInputElement).value);
  }, []);

  const handleCreateInput = useCallback((e: CustomEvent) => {
    setNewCollectionName((e.target as HTMLInputElement).value);
  }, []);

  const handleCreateKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleCreateNewCollection();
      } else if (e.key === 'Escape') {
        handleCancelCreateNew();
      }
    },
    [handleCreateNewCollection, handleCancelCreateNew]
  );

  return (
    <Popover
      open={open}
      opener={opener}
      onClose={handleClose}
      placement="Bottom"
      className={styles.popover}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Icon name="bookmark" className={styles.headerIcon} />
            <Text className={styles.headerText}>{TEXT.TITLE}</Text>
          </div>

          <Input
            placeholder={TEXT.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onInput={handleSearchInput}
            showClearIcon
            className={styles.searchInput}
          />
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <MessageStrip design="Negative" hideCloseButton>
              {error}
            </MessageStrip>
          </div>
        )}

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <BusyIndicator active size="S" />
            </div>
          ) : (
            <>
              {showCreateNew ? (
                <div className={styles.createCard}>
                  <div className={styles.createCardHeader}>
                    <Icon name="add" className={styles.createIcon} />
                    <Text className={styles.createTitle}>{TEXT.CREATE_NEW_TITLE}</Text>
                  </div>

                  <div className={styles.createInputContainer}>
                    <Input
                      placeholder={TEXT.CREATE_INPUT_PLACEHOLDER}
                      value={newCollectionName}
                      onInput={handleCreateInput}
                      onKeyDown={handleCreateKeyPress as any}
                      className={styles.createInput}
                      disabled={creating}
                    />
                  </div>

                  <div className={styles.createActions}>
                    <Button
                      icon="decline"
                      design="Transparent"
                      onClick={handleCancelCreateNew}
                      disabled={creating}
                    />
                    <Button
                      icon="accept"
                      design="Positive"
                      onClick={handleCreateNewCollection}
                      disabled={!newCollectionName.trim() || creating}
                    >
                      {creating ? TEXT.CREATE_BUTTON_LOADING : TEXT.CREATE_BUTTON}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.createSection}>
                  <Button
                    icon="add"
                    design="Transparent"
                    onClick={handleShowCreateNew}
                    className={styles.createButton}
                  >
                    {TEXT.CREATE_NEW_BUTTON}
                  </Button>
                </div>
              )}

              {filteredCollections.length > 0 ? (
                <div>
                  {filteredCollections.map((collection) => (
                    <div
                      key={collection.id}
                      onClick={() => handleSaveToCollection(collection.id, collection.name)}
                      className={styles.collectionItem}
                      style={{ opacity: saving === collection.id ? 0.6 : 1 }}
                    >
                      <div className={styles.collectionItemContent}>
                        <div className={styles.collectionItemInfo}>
                          <Text className={styles.collectionName}>{collection.name}</Text>
                          <Text className={styles.collectionCount}>
                            {collection.itemCount} {TEXT.ITEMS_SUFFIX}
                          </Text>
                        </div>
                        {saving === collection.id && <BusyIndicator active size="S" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className={styles.emptyState}>
                  <Text className={styles.emptyText}>
                    {TEXT.NO_COLLECTIONS_SEARCH} "{searchQuery}"
                  </Text>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Icon name="bookmark" className={styles.emptyIcon} />
                  <Text className={styles.emptyText}>{TEXT.NO_COLLECTIONS_EMPTY}</Text>
                  <Text className={styles.emptySubtext}>{TEXT.NO_COLLECTIONS_HINT}</Text>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Popover>
  );
}

export default SaveToCollectionPopover;
