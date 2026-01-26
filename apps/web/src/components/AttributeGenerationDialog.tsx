import { useState, useEffect } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Title,
  Text,
  Icon,
  BusyIndicator,
  TextArea,
  Label,
  Input,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/edit.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/hint.js';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-icons/dist/question-mark.js';

interface AttributeGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedTypes: string[];
  productGroup: string;
  selectedSeason: string | null;
  dateRange?: { from: string; to: string };
  generatedAttributes: any;
  attributesLoading: boolean;
  feedbackText: string;
  onFeedbackChange: (text: string) => void;
  onRegenerate: () => void;
  onSave: (attributes: any) => void;
}

export function AttributeGenerationDialog({
  open,
  onClose,
  selectedTypes,
  productGroup,
  selectedSeason,
  dateRange,
  generatedAttributes,
  attributesLoading,
  feedbackText,
  onFeedbackChange,
  onRegenerate,
  onSave,
}: AttributeGenerationDialogProps) {
  // Local state for managing attributes
  const [attributes, setAttributes] = useState<any>({});
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const [editingAttributeValue, setEditingAttributeValue] = useState('');
  const [addingNewAttribute, setAddingNewAttribute] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');

  // Options popup state
  const [optionsPopupOpen, setOptionsPopupOpen] = useState(false);
  const [selectedAttributeKey, setSelectedAttributeKey] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');
  const [addingNewOption, setAddingNewOption] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');

  // Info popup state
  const [infoPopupOpen, setInfoPopupOpen] = useState(false);

  // Sync generated attributes to local state
  useEffect(() => {
    if (generatedAttributes) {
      setAttributes(generatedAttributes);
    }
  }, [generatedAttributes]);

  // Format attribute name: remove product type prefix and convert to Title Case
  const formatAttributeName = (name: string): string => {
    // Remove product type prefixes
    let cleanName = name;
    selectedTypes.forEach((type) => {
      const prefix = type.toLowerCase() + '_';
      if (cleanName.toLowerCase().startsWith(prefix)) {
        cleanName = cleanName.substring(prefix.length);
      }
    });

    // Convert snake_case to Title Case
    return cleanName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format seasonal lens display
  const getSeasonalLens = () => {
    if (selectedSeason) {
      return `${selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1)}`;
    }
    if (dateRange) {
      return `${dateRange.from} to ${dateRange.to}`;
    }
    return 'All time';
  };

  // Get all attributes as flat list
  const getAttributesList = () => {
    const list: Array<{ category: string; key: string; name: string; values: string[] }> = [];
    Object.entries(attributes).forEach(([category, attrs]: [string, any]) => {
      Object.entries(attrs).forEach(([key, values]: [string, any]) => {
        list.push({
          category,
          key,
          name: formatAttributeName(key),
          values: Array.isArray(values) ? values : [values],
        });
      });
    });
    return list;
  };

  // Handlers: Attribute actions
  const handleEditAttribute = (category: string, key: string, currentName: string) => {
    setEditingAttribute(`${category}::${key}`);
    setEditingAttributeValue(currentName);
  };

  const handleSaveAttributeEdit = (category: string, oldKey: string) => {
    if (editingAttributeValue.trim()) {
      const newKey = editingAttributeValue.toLowerCase().replace(/\s+/g, '_');
      const updatedAttrs = { ...attributes };

      if (updatedAttrs[category]) {
        const values = updatedAttrs[category][oldKey];
        delete updatedAttrs[category][oldKey];
        updatedAttrs[category][newKey] = values;
      }

      setAttributes(updatedAttrs);
    }
    setEditingAttribute(null);
    setEditingAttributeValue('');
  };

  const handleCancelAttributeEdit = () => {
    setEditingAttribute(null);
    setEditingAttributeValue('');
  };

  const handleDeleteAttribute = (category: string, key: string) => {
    const updatedAttrs = { ...attributes };
    if (updatedAttrs[category]) {
      delete updatedAttrs[category][key];
      if (Object.keys(updatedAttrs[category]).length === 0) {
        delete updatedAttrs[category];
      }
    }
    setAttributes(updatedAttrs);
  };

  const handleAddNewAttribute = () => {
    if (newAttributeName.trim()) {
      const key = newAttributeName.toLowerCase().replace(/\s+/g, '_');
      const category = selectedTypes[0] || 'General'; // Use first product type as category

      const updatedAttrs = { ...attributes };
      if (!updatedAttrs[category]) {
        updatedAttrs[category] = {};
      }
      updatedAttrs[category][key] = [];

      setAttributes(updatedAttrs);
      setNewAttributeName('');
      setAddingNewAttribute(false);
    }
  };

  // Handlers: Options popup
  const handleOpenOptionsPopup = (category: string, key: string) => {
    setSelectedAttributeKey(`${category}::${key}`);
    setOptionsPopupOpen(true);
  };

  const handleCloseOptionsPopup = () => {
    setOptionsPopupOpen(false);
    setSelectedAttributeKey(null);
    setEditingOption(null);
    setAddingNewOption(false);
  };

  const getCurrentOptions = (): string[] => {
    if (!selectedAttributeKey) return [];
    const [category, key] = selectedAttributeKey.split('::');
    return attributes[category]?.[key] || [];
  };

  const handleEditOption = (index: number, currentValue: string) => {
    setEditingOption(index);
    setEditingOptionValue(currentValue);
  };

  const handleSaveOptionEdit = (index: number) => {
    if (editingOptionValue.trim() && selectedAttributeKey) {
      const [category, key] = selectedAttributeKey.split('::');
      const updatedAttrs = { ...attributes };
      if (updatedAttrs[category]?.[key]) {
        updatedAttrs[category][key][index] = editingOptionValue.trim();
        setAttributes(updatedAttrs);
      }
    }
    setEditingOption(null);
    setEditingOptionValue('');
  };

  const handleCancelOptionEdit = () => {
    setEditingOption(null);
    setEditingOptionValue('');
  };

  const handleDeleteOption = (index: number) => {
    if (selectedAttributeKey) {
      const [category, key] = selectedAttributeKey.split('::');
      const updatedAttrs = { ...attributes };
      if (updatedAttrs[category]?.[key]) {
        updatedAttrs[category][key] = updatedAttrs[category][key].filter(
          (_: any, i: number) => i !== index
        );
        setAttributes(updatedAttrs);
      }
    }
  };

  const handleAddNewOption = () => {
    if (newOptionValue.trim() && selectedAttributeKey) {
      const [category, key] = selectedAttributeKey.split('::');
      const updatedAttrs = { ...attributes };
      if (updatedAttrs[category]?.[key]) {
        updatedAttrs[category][key].push(newOptionValue.trim());
        setAttributes(updatedAttrs);
      }
      setNewOptionValue('');
      setAddingNewOption(false);
    }
  };

  const handleSaveConfiguration = () => {
    onSave(attributes);
    onClose();
  };

  const attributesList = getAttributesList();
  const currentOptions = getCurrentOptions();
  const selectedAttributeName = selectedAttributeKey
    ? formatAttributeName(selectedAttributeKey.split('::')[1])
    : '';

  return (
    <>
      {/* Main Dialog */}
      <Dialog
        open={open}
        style={{
          width: '90vw',
          height: '90vh',
          maxWidth: '1400px',
          maxHeight: '900px',
        }}
        headerText=""
        footer={
          <Bar
            design="Footer"
            endContent={
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button design="Default" onClick={onClose}>
                  Close
                </Button>
                <Button
                  design="Emphasized"
                  onClick={handleSaveConfiguration}
                  disabled={
                    attributesLoading ||
                    !generatedAttributes ||
                    Object.keys(generatedAttributes).length === 0
                  }
                >
                  Proceed with the Data Enrichment
                </Button>
              </div>
            }
          />
        }
      >
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
          {/* Left Panel - Configuration Scope (30%) */}
          <div
            style={{
              width: '30%',
              borderRight: '1px solid var(--sapList_BorderColor)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              background: 'var(--sapBackgroundColor)',
            }}
          >
            <div
              style={{
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--sapList_BorderColor)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Title level="H5" style={{ fontSize: '1.25rem' }}>
                    Refine Attribute Generation
                  </Title>
                  <Button
                    design="Transparent"
                    icon="question-mark"
                    onClick={() => setInfoPopupOpen(true)}
                    style={{
                      width: '24px',
                      height: '24px',
                      minWidth: '24px',
                      padding: 0,
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                }}
              >
                <div style={{ flex: 1, width: '100%' }}>
                  <TextArea
                    value={feedbackText}
                    onInput={(e: any) => onFeedbackChange(e.target.value)}
                    placeholder="Provide additional feedback to enhance attribute generation..."
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </div>
                <Button
                  design="Attention"
                  icon="da"
                  onClick={() => onRegenerate()}
                  disabled={attributesLoading}
                >
                  Regenerate
                </Button>
              </div>
            </div>
            <div>
              <Title
                level="H5"
                style={{
                  marginBottom: '0.5rem',
                  color: 'var(--sapContent_LabelColor)',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                }}
              >
                Configuration Scope
              </Title>
            </div>

            {/* Product Group */}
            <div>
              <Label
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}
              >
                Product Group
              </Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="product" style={{ color: 'var(--sapContent_IconColor)' }} />
                <Text>{productGroup}</Text>
              </div>
            </div>

            {/* Product Types */}
            <div>
              <Label
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}
              >
                Product Types
              </Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedTypes.map((type) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon name="product" style={{ color: 'var(--sapContent_IconColor)' }} />
                    <Text>{type}</Text>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Lens */}
            <div>
              <Label
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}
              >
                Seasonal Lens
              </Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="history" style={{ color: 'var(--sapContent_IconColor)' }} />
                <Text>{getSeasonalLens()}</Text>
              </div>
            </div>

            {/* Info Box */}
            <div
              style={{
                padding: '1rem',
                background: 'var(--sapInformationBackground)',
                border: '1px solid var(--sapInformationBorderColor)',
                borderRadius: '0.5rem',
              }}
            >
              <Icon
                name="hint"
                style={{ color: 'var(--sapInformativeColor)', marginBottom: '0.5rem' }}
              />
              <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>
                Attributes are generated based on the selected product types.
              </Text>
            </div>
          </div>

          {/* Right Panel - Attribute Generation (70%) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Generated Attributes List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Title level="H5">Generated Attributes</Title>
                <Button
                  design="Transparent"
                  icon="add"
                  onClick={() => setAddingNewAttribute(true)}
                  disabled={attributesLoading}
                >
                  Add Attribute
                </Button>
              </div>

              {attributesLoading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '300px',
                  }}
                >
                  <BusyIndicator active size="L" />
                </div>
              ) : attributesList.length === 0 && !addingNewAttribute ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: 'var(--sapContent_LabelColor)',
                  }}
                >
                  <Text>No attributes generated yet</Text>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Add New Attribute Row */}
                  {addingNewAttribute && (
                    <div
                      style={{
                        border: '2px dashed var(--sapList_BorderColor)',
                        borderRadius: '0.25rem',
                        padding: '0.75rem 1rem',
                        background: 'var(--sapList_Background)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      <Input
                        value={newAttributeName}
                        onInput={(e: any) => setNewAttributeName(e.target.value)}
                        placeholder="Enter attribute name..."
                        style={{ flex: 1 }}
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter') handleAddNewAttribute();
                          if (e.key === 'Escape') {
                            setAddingNewAttribute(false);
                            setNewAttributeName('');
                          }
                        }}
                      />
                      <Button design="Emphasized" onClick={handleAddNewAttribute}>
                        Add
                      </Button>
                      <Button
                        design="Transparent"
                        onClick={() => {
                          setAddingNewAttribute(false);
                          setNewAttributeName('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Attribute List */}
                  {attributesList.map((attr, index) => {
                    const isEditing = editingAttribute === `${attr.category}::${attr.key}`;

                    return (
                      <div
                        key={`${attr.category}-${attr.key}-${index}`}
                        style={{
                          border: '1px solid var(--sapList_BorderColor)',
                          borderRadius: '0.25rem',
                          padding: '0.75rem 1rem',
                          background: 'var(--sapList_Background)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isEditing)
                            e.currentTarget.style.background = 'var(--sapList_Hover_Background)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isEditing)
                            e.currentTarget.style.background = 'var(--sapList_Background)';
                        }}
                      >
                        {/* Attribute Name - Clickable or Editable */}
                        {isEditing ? (
                          <Input
                            value={editingAttributeValue}
                            onInput={(e: any) => setEditingAttributeValue(e.target.value)}
                            style={{ flex: 1, marginRight: '1rem' }}
                            onKeyDown={(e: any) => {
                              if (e.key === 'Enter')
                                handleSaveAttributeEdit(attr.category, attr.key);
                              if (e.key === 'Escape') handleCancelAttributeEdit();
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                            onClick={() => handleOpenOptionsPopup(attr.category, attr.key)}
                          >
                            <Icon
                              name="ai"
                              style={{ color: 'var(--sapContent_IconColor)', fontSize: '1rem' }}
                            />
                            <div
                              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                            >
                              <Text style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                {attr.name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--sapContent_LabelColor)',
                                }}
                              >
                                {attr.values.length} option{attr.values.length !== 1 ? 's' : ''}
                              </Text>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {isEditing ? (
                            <>
                              <Button
                                design="Emphasized"
                                onClick={() => handleSaveAttributeEdit(attr.category, attr.key)}
                              >
                                Save
                              </Button>
                              <Button design="Transparent" onClick={handleCancelAttributeEdit}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                design="Transparent"
                                icon="edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAttribute(attr.category, attr.key, attr.name);
                                }}
                              />
                              <Button
                                design="Transparent"
                                icon="delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAttribute(attr.category, attr.key);
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Info Popup Dialog */}
      <Dialog
        open={infoPopupOpen}
        headerText="Refine Attribute Generation - Help"
        style={{ width: '550px', maxHeight: '600px' }}
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Emphasized" onClick={() => setInfoPopupOpen(false)}>
                Got it
              </Button>
            }
          />
        }
      >
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <Title level="H6" style={{ marginBottom: '0.75rem', fontWeight: '600' }}>
              What is Attribute Refinement?
            </Title>
            <Text>
              Our system uses AI to automatically suggest the best categories and details
              (attributes) for your products. You can easily tweak these suggestions until they are
              perfect. Getting these details right is important because they act as a guide for the
              next step. Without them, product descriptions can end up sounding too generic.
              Instead, the AI uses your specific list of attributes to 'look' at each product image
              and write a detailed, accurate description that fits your brand perfectly.
            </Text>
          </div>

          <div>
            <Title level="H6" style={{ marginBottom: '0.75rem', fontWeight: '600' }}>
              How to Use Feedback
            </Title>
            <Text style={{ display: 'block', marginBottom: '0.5rem' }}>
              Provide specific feedback in the text area to improve the generated attributes. For
              example:
            </Text>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                marginLeft: '1rem',
              }}
            >
              <Text>• "Add more color-related attributes"</Text>
              <Text>• "Focus on sustainable materials"</Text>
              <Text>• "Include size and fit details"</Text>
              <Text>• "Remove overly technical attributes"</Text>
            </div>
          </div>

          <div>
            <Title level="H6" style={{ marginBottom: '0.75rem', fontWeight: '600' }}>
              Managing Attributes
            </Title>
            <Text style={{ display: 'block', marginBottom: '0.5rem' }}>
              You can manually manage the generated attributes:
            </Text>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                marginLeft: '1rem',
              }}
            >
              <Text>
                • <Text style={{ fontWeight: '600' }}>Add:</Text> Create new attributes manually
              </Text>
              <Text>
                • <Text style={{ fontWeight: '600' }}>Edit:</Text> Rename existing attributes
              </Text>
              <Text>
                • <Text style={{ fontWeight: '600' }}>Delete:</Text> Remove unwanted attributes
              </Text>
              <Text>
                • <Text style={{ fontWeight: '600' }}>Click:</Text> View and modify attribute
                options
              </Text>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              background: 'var(--sapInformationBackground)',
              border: '1px solid var(--sapInformationBorderColor)',
              borderRadius: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <Icon
                name="hint"
                style={{ color: 'var(--sapInformativeColor)', marginTop: '0.25rem' }}
              />
              <Text>
                <Text style={{ fontWeight: '600' }}>Tip:</Text> The more specific your feedback, the
                better the AI can refine the attributes to match your needs.
              </Text>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Options Popup Dialog */}
      <Dialog
        open={optionsPopupOpen}
        headerText={selectedAttributeName}
        style={{ width: '500px', height: '450px' }}
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Transparent" onClick={handleCloseOptionsPopup}>
                Close
              </Button>
            }
          />
        }
      >
        <div
          style={{
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            height: '100%',
          }}
        >
          {/* Add New Option Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button design="Transparent" icon="add" onClick={() => setAddingNewOption(true)}>
              Add Option
            </Button>
          </div>

          {/* Options List (Scrollable, shows 5 initially) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {/* Add New Option Row */}
            {addingNewOption && (
              <div
                style={{
                  border: '2px dashed var(--sapList_BorderColor)',
                  borderRadius: '0.25rem',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Input
                  value={newOptionValue}
                  onInput={(e: any) => setNewOptionValue(e.target.value)}
                  placeholder="Enter option value..."
                  style={{ flex: 1 }}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter') handleAddNewOption();
                    if (e.key === 'Escape') {
                      setAddingNewOption(false);
                      setNewOptionValue('');
                    }
                  }}
                />
                <Button design="Emphasized" onClick={handleAddNewOption}>
                  Add
                </Button>
                <Button
                  design="Transparent"
                  onClick={() => {
                    setAddingNewOption(false);
                    setNewOptionValue('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Option Rows */}
            {currentOptions.map((option, index) => {
              const isEditing = editingOption === index;

              return (
                <div
                  key={index}
                  style={{
                    border: '1px solid var(--sapList_BorderColor)',
                    borderRadius: '0.25rem',
                    padding: '0.75rem',
                    background: 'var(--sapList_Background)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '48px',
                  }}
                >
                  {isEditing ? (
                    <>
                      <Input
                        value={editingOptionValue}
                        onInput={(e: any) => setEditingOptionValue(e.target.value)}
                        style={{ flex: 1, marginRight: '0.5rem' }}
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter') handleSaveOptionEdit(index);
                          if (e.key === 'Escape') handleCancelOptionEdit();
                        }}
                      />
                      <Button design="Emphasized" onClick={() => handleSaveOptionEdit(index)}>
                        Save
                      </Button>
                      <Button design="Transparent" onClick={handleCancelOptionEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Text style={{ flex: 1, fontSize: '0.875rem' }}>{option}</Text>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          design="Transparent"
                          icon="edit"
                          onClick={() => handleEditOption(index, option)}
                        />
                        <Button
                          design="Transparent"
                          icon="delete"
                          onClick={() => handleDeleteOption(index)}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Dialog>
    </>
  );
}
