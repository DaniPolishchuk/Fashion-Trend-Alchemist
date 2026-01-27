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

interface SaveToCollectionPopoverProps {
  open: boolean;
  opener?: string; // ID of the opener element
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

  // Fetch collections when popover opens
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

  // Filter collections based on search
  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle save to existing collection
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

  // Handle create new collection
  const handleCreateNewCollection = useCallback(async () => {
    if (!newCollectionName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      // Create collection
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

      // Add design to the new collection
      const addResult = await api.collections.addDesign(newCollection.id, designId);

      if (addResult.error) {
        setError(addResult.error);
        return;
      }

      // Update local collections list with proper typing
      const newCollectionItem: CollectionListItem = {
        id: newCollection.id,
        name: newCollection.name,
        createdAt: newCollection.createdAt,
        itemCount: 1, // Just added one design
        imageUrls: [], // No images yet
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

  // Handle show create new
  const handleShowCreateNew = useCallback(() => {
    setShowCreateNew(true);
    setNewCollectionName('');
  }, []);

  // Handle cancel create new
  const handleCancelCreateNew = useCallback(() => {
    setShowCreateNew(false);
    setNewCollectionName('');
  }, []);

  // Handle popover close
  const handleClose = useCallback(() => {
    setShowCreateNew(false);
    setNewCollectionName('');
    setSearchQuery('');
    setError(null);
    onClose();
  }, [onClose]);

  // Handle search input
  const handleSearchInput = useCallback((e: CustomEvent) => {
    setSearchQuery((e.target as HTMLInputElement).value);
  }, []);

  // Handle create input
  const handleCreateInput = useCallback((e: CustomEvent) => {
    setNewCollectionName((e.target as HTMLInputElement).value);
  }, []);

  // Handle create input keypress
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
      style={{
        width: '320px',
        maxHeight: '400px',
      }}
    >
      <div style={{ padding: '1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
          >
            <Icon name="bookmark" style={{ color: 'var(--sapContent_IconColor)' }} />
            <Text style={{ fontWeight: '600', fontSize: '0.875rem' }}>Save to Collection</Text>
          </div>

          {/* Search input */}
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onInput={handleSearchInput}
            showClearIcon
            style={{ width: '100%' }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div style={{ marginBottom: '0.75rem' }}>
            <MessageStrip design="Negative" hideCloseButton>
              {error}
            </MessageStrip>
          </div>
        )}

        {/* Content */}
        <div style={{ minHeight: '120px', maxHeight: '240px', overflow: 'auto' }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '120px',
              }}
            >
              <BusyIndicator active size="S" />
            </div>
          ) : (
            <>
              {/* Create New Collection Section */}
              {showCreateNew ? (
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--sapGroup_ContentBackground)',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--sapList_BorderColor)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <Icon
                      name="add"
                      style={{ color: 'var(--sapPositiveColor)', fontSize: '0.875rem' }}
                    />
                    <Text
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        color: 'var(--sapPositiveColor)',
                      }}
                    >
                      Create New Collection
                    </Text>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <Input
                      placeholder="Enter collection name..."
                      value={newCollectionName}
                      onInput={handleCreateInput}
                      onKeyDown={handleCreateKeyPress as any}
                      style={{ width: '100%' }}
                      disabled={creating}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
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
                      {creating ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '0.75rem' }}>
                  <Button
                    icon="add"
                    design="Transparent"
                    onClick={handleShowCreateNew}
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      color: 'var(--sapPositiveColor)',
                      borderColor: 'var(--sapPositiveColor)',
                      borderStyle: 'dashed',
                    }}
                  >
                    Create New Collection
                  </Button>
                </div>
              )}

              {/* Collections List */}
              {filteredCollections.length > 0 ? (
                <div>
                  {filteredCollections.map((collection) => (
                    <div
                      key={collection.id}
                      onClick={() => handleSaveToCollection(collection.id, collection.name)}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid var(--sapList_BorderColor)',
                        borderRadius: '0.375rem',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        opacity: saving === collection.id ? 0.6 : 1,
                        transition: 'all 0.2s',
                        background: 'var(--sapList_Background)',
                      }}
                      onMouseEnter={(e) => {
                        if (saving !== collection.id) {
                          e.currentTarget.style.background = 'var(--sapList_Hover_Background)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--sapList_Background)';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          width: '100%',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                            {collection.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--sapContent_LabelColor)',
                              display: 'block',
                              marginTop: '0.125rem',
                            }}
                          >
                            {collection.itemCount} items
                          </Text>
                        </div>
                        {saving === collection.id && <BusyIndicator active size="S" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '80px',
                    gap: '0.5rem',
                  }}
                >
                  <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                    No collections found matching "{searchQuery}"
                  </Text>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '80px',
                    gap: '0.5rem',
                  }}
                >
                  <Icon
                    name="bookmark"
                    style={{ color: 'var(--sapContent_LabelColor)', fontSize: '1.5rem' }}
                  />
                  <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                    No collections yet
                  </Text>
                  <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.75rem' }}>
                    Create your first collection above
                  </Text>
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
