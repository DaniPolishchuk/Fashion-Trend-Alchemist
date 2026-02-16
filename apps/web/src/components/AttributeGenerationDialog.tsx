/**
 * Attribute Generation Dialog Component
 * Refactored with constants, CSS modules, and custom hooks
 */

import { useState, useEffect, useRef } from 'react';
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
import '@ui5/webcomponents-icons/dist/history.js';
import '@ui5/webcomponents-icons/dist/ai.js';
import '@ui5/webcomponents-icons/dist/da.js';
import '@ui5/webcomponents-icons/dist/download.js';
import '@ui5/webcomponents-icons/dist/upload.js';

import { useAttributeEditor } from '../hooks/useAttributeEditor';
import { useOptionsManager } from '../hooks/useOptionsManager';
import {
  formatAttributeName,
  getSeasonalLens,
  flattenAttributes,
  parseAttributeKey,
} from '../utils/attributeFormatting';
import { DIALOG, TEXT, ICONS, SIZES } from '../constants/attributeDialog';
import styles from '../styles/components/AttributeGenerationDialog.module.css';

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
  const [infoPopupOpen, setInfoPopupOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const defaultCategory = selectedTypes[0] || 'General';
  const attributeEditor = useAttributeEditor(attributes, setAttributes, defaultCategory);
  const optionsManager = useOptionsManager(attributes, setAttributes);

  // Sync generated attributes to local state ONLY ONCE when dialog opens
  useEffect(() => {
    if (generatedAttributes && !hasInitialized) {
      setAttributes(generatedAttributes);
      setHasInitialized(true);
    }
  }, [generatedAttributes, hasInitialized]);

  // Reset initialization flag when dialog closes
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
    }
  }, [open]);

  // Get formatted attribute list
  const attributesList = flattenAttributes(attributes);
  const currentOptions = optionsManager.getCurrentOptions();
  const selectedAttributeName = optionsManager.selectedAttributeKey
    ? formatAttributeName(parseAttributeKey(optionsManager.selectedAttributeKey)[1], selectedTypes)
    : '';

  const handleSaveConfiguration = () => {
    onSave(attributes);
    onClose();
  };

  // Validate ontology structure
  const validateOntologyStructure = (data: unknown): { valid: boolean; error?: string } => {
    // Must be a non-null object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { valid: false, error: TEXT.ERROR_INVALID_STRUCTURE };
    }

    const keys = Object.keys(data);

    // Must have exactly one top-level key (the category)
    if (keys.length !== 1) {
      return { valid: false, error: TEXT.ERROR_INVALID_STRUCTURE };
    }

    const categoryValue = (data as Record<string, unknown>)[keys[0]];

    // The category value must be a non-null object
    if (typeof categoryValue !== 'object' || categoryValue === null || Array.isArray(categoryValue)) {
      return { valid: false, error: TEXT.ERROR_INVALID_STRUCTURE };
    }

    const attributeKeys = Object.keys(categoryValue);

    // Must contain at least one attribute
    if (attributeKeys.length === 0) {
      return { valid: false, error: TEXT.ERROR_EMPTY_ONTOLOGY };
    }

    // Each attribute value must be an array of strings
    for (const attrKey of attributeKeys) {
      const attrValue = (categoryValue as Record<string, unknown>)[attrKey];
      if (!Array.isArray(attrValue)) {
        return { valid: false, error: TEXT.ERROR_INVALID_STRUCTURE };
      }
      for (const item of attrValue) {
        if (typeof item !== 'string') {
          return { valid: false, error: TEXT.ERROR_INVALID_STRUCTURE };
        }
      }
    }

    return { valid: true };
  };

  // Download ontology handler
  const handleDownloadOntology = () => {
    const blob = new Blob([JSON.stringify(attributes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ontology-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Upload ontology handler
  const handleUploadOntology = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const validation = validateOntologyStructure(data);
        if (!validation.valid) {
          setUploadError(validation.error || TEXT.ERROR_INVALID_STRUCTURE);
          return;
        }
        setAttributes(data);
        setUploadError(null);
      } catch {
        setUploadError(TEXT.ERROR_INVALID_JSON);
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Check if attributes exist
  const hasAttributes = Object.keys(attributes).length > 0;

  return (
    <>
      {/* Main Dialog */}
      <Dialog
        open={open}
        style={{
          width: DIALOG.MAIN.WIDTH,
          height: DIALOG.MAIN.HEIGHT,
          maxWidth: DIALOG.MAIN.MAX_WIDTH,
          maxHeight: DIALOG.MAIN.MAX_HEIGHT,
        }}
        headerText=""
        footer={
          <Bar
            design="Footer"
            endContent={
              <div className={styles.footerActions}>
                <Button design="Default" onClick={onClose}>
                  {TEXT.BUTTON_CLOSE}
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
                  {TEXT.BUTTON_PROCEED}
                </Button>
              </div>
            }
          />
        }
      >
        <div className={styles.dialogContainer}>
          {/* Left Panel - Configuration Scope */}
          <div className={styles.leftPanel}>
            <div className={styles.refineSection}>
              <div className={styles.refineHeader}>
                <div className={styles.refineTitle}>
                  <Title level="H5" className={styles.refineTitleText}>
                    {TEXT.TITLE_REFINE}
                  </Title>
                  <Button
                    design="Transparent"
                    icon={ICONS.QUESTION_MARK}
                    onClick={() => setInfoPopupOpen(true)}
                    className={styles.helpButton}
                  />
                </div>
              </div>
              <div className={styles.feedbackContainer}>
                <div className={styles.feedbackTextArea}>
                  <TextArea
                    value={feedbackText}
                    onInput={(e: any) => onFeedbackChange(e.target.value)}
                    placeholder={TEXT.PLACEHOLDER_FEEDBACK}
                    rows={SIZES.FEEDBACK_ROWS}
                    style={{ width: '100%' }}
                  />
                </div>
                <Button
                  design="Attention"
                  icon={ICONS.DA}
                  onClick={onRegenerate}
                  disabled={attributesLoading}
                >
                  {TEXT.BUTTON_REGENERATE}
                </Button>
              </div>
            </div>

            <div>
              <Title level="H5" className={styles.configSectionTitle}>
                {TEXT.SECTION_CONFIG_SCOPE}
              </Title>
            </div>

            {/* Product Group */}
            <div className={styles.configItem}>
              <Label className={styles.configLabel}>{TEXT.LABEL_PRODUCT_GROUP}</Label>
              <div className={styles.configValue}>
                <Icon name={ICONS.PRODUCT} className={styles.configIcon} />
                <Text>{productGroup}</Text>
              </div>
            </div>

            {/* Product Types */}
            <div className={styles.configItem}>
              <Label className={styles.configLabel}>{TEXT.LABEL_PRODUCT_TYPES}</Label>
              <div className={styles.configTypesList}>
                {selectedTypes.map((type) => (
                  <div key={type} className={styles.configValue}>
                    <Icon name={ICONS.PRODUCT} className={styles.configIcon} />
                    <Text>{type}</Text>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Lens */}
            <div className={styles.configItem}>
              <Label className={styles.configLabel}>{TEXT.LABEL_SEASONAL_LENS}</Label>
              <div className={styles.configValue}>
                <Icon name={ICONS.HISTORY} className={styles.configIcon} />
                <Text>{getSeasonalLens(selectedSeason, dateRange)}</Text>
              </div>
            </div>

            {/* Info Box */}
            <div className={styles.infoBox}>
              <Icon name={ICONS.HINT} className={styles.infoBoxIcon} />
              <Text className={styles.infoBoxText}>{TEXT.MESSAGE_INFO_BOX}</Text>
            </div>
          </div>

          {/* Right Panel - Attribute Generation */}
          <div className={styles.rightPanel}>
            <div className={styles.attributesContainer}>
              <div className={styles.attributesHeader}>
                <div className={styles.attributesHeaderLeft}>
                  <Title level="H5">{TEXT.TITLE_GENERATED}</Title>
                  <Button
                    design="Transparent"
                    icon={ICONS.ADD}
                    onClick={attributeEditor.startAddNew}
                    disabled={attributesLoading}
                  >
                    {TEXT.BUTTON_ADD_ATTRIBUTE}
                  </Button>
                </div>
                <div className={styles.attributesHeaderRight}>
                  <Button
                    design="Transparent"
                    icon={ICONS.DOWNLOAD}
                    onClick={handleDownloadOntology}
                    disabled={!hasAttributes || attributesLoading}
                  >
                    {TEXT.BUTTON_DOWNLOAD}
                  </Button>
                  <Button
                    design="Transparent"
                    icon={ICONS.UPLOAD}
                    onClick={handleUploadClick}
                    disabled={attributesLoading}
                  >
                    {TEXT.BUTTON_UPLOAD}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={TEXT.FILE_ACCEPT}
                    onChange={handleUploadOntology}
                    className={styles.hiddenFileInput}
                  />
                </div>
              </div>

              {uploadError && (
                <div className={styles.uploadErrorMessage}>
                  <Text>{uploadError}</Text>
                </div>
              )}

              {attributesLoading ? (
                <div className={styles.loadingContainer}>
                  <BusyIndicator active size="L" />
                </div>
              ) : attributesList.length === 0 && !attributeEditor.addingNewAttribute ? (
                <div className={styles.emptyState}>
                  <Text>{TEXT.MESSAGE_NO_ATTRIBUTES}</Text>
                </div>
              ) : (
                <div className={styles.attributesList}>
                  {/* Add New Attribute Row */}
                  {attributeEditor.addingNewAttribute && (
                    <div className={styles.addNewRow}>
                      <Input
                        value={attributeEditor.newAttributeName}
                        onInput={(e: any) => attributeEditor.setNewAttributeName(e.target.value)}
                        placeholder={TEXT.PLACEHOLDER_ATTRIBUTE_NAME}
                        className={styles.addNewInput}
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter') attributeEditor.addNew();
                          if (e.key === 'Escape') attributeEditor.cancelAddNew();
                        }}
                      />
                      <Button design="Emphasized" onClick={attributeEditor.addNew}>
                        {TEXT.ACTION_ADD}
                      </Button>
                      <Button design="Transparent" onClick={attributeEditor.cancelAddNew}>
                        {TEXT.ACTION_CANCEL}
                      </Button>
                    </div>
                  )}

                  {/* Attribute List */}
                  {attributesList.map((attr, index) => {
                    const attributeKey = `${attr.category}::${attr.key}`;
                    const isEditing = attributeEditor.editingAttribute === attributeKey;
                    const formattedName = formatAttributeName(attr.key, selectedTypes);

                    return (
                      <div
                        key={`${attr.category}-${attr.key}-${index}`}
                        className={styles.attributeItem}
                      >
                        {isEditing ? (
                          <>
                            <Input
                              value={attributeEditor.editingAttributeValue}
                              onInput={(e: any) =>
                                attributeEditor.setEditingAttributeValue(e.target.value)
                              }
                              className={styles.attributeEditInput}
                              onKeyDown={(e: any) => {
                                if (e.key === 'Enter')
                                  attributeEditor.saveEdit(attr.category, attr.key);
                                if (e.key === 'Escape') attributeEditor.cancelEdit();
                              }}
                            />
                            <div className={styles.attributeActions}>
                              <Button
                                design="Emphasized"
                                onClick={() => attributeEditor.saveEdit(attr.category, attr.key)}
                              >
                                {TEXT.ACTION_SAVE}
                              </Button>
                              <Button design="Transparent" onClick={attributeEditor.cancelEdit}>
                                {TEXT.ACTION_CANCEL}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className={styles.attributeContent}
                              onClick={() => optionsManager.openPopup(attr.category, attr.key)}
                            >
                              <Icon name={ICONS.AI} className={styles.attributeIcon} />
                              <div className={styles.attributeInfo}>
                                <Text className={styles.attributeName}>{formattedName}</Text>
                                <Text className={styles.attributeCount}>
                                  {attr.values.length} option{attr.values.length !== 1 ? 's' : ''}
                                </Text>
                              </div>
                            </div>
                            <div className={styles.attributeActions}>
                              <Button
                                design="Transparent"
                                icon={ICONS.EDIT}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  attributeEditor.startEdit(attr.category, attr.key, formattedName);
                                }}
                              />
                              <Button
                                design="Transparent"
                                icon={ICONS.DELETE}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  attributeEditor.deleteAttribute(attr.category, attr.key);
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Info Dialog */}
      <Dialog
        open={infoPopupOpen}
        headerText={TEXT.INFO_TITLE}
        style={{ width: DIALOG.INFO.WIDTH, maxHeight: DIALOG.INFO.MAX_HEIGHT }}
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Emphasized" onClick={() => setInfoPopupOpen(false)}>
                {TEXT.BUTTON_GOT_IT}
              </Button>
            }
          />
        }
      >
        <div className={styles.infoDialogContent}>
          <div className={styles.infoSection}>
            <Title level="H6" className={styles.infoSectionTitle}>
              {TEXT.INFO_WHAT_TITLE}
            </Title>
            <Text>{TEXT.INFO_WHAT_TEXT}</Text>
          </div>

          <div className={styles.infoSection}>
            <Title level="H6" className={styles.infoSectionTitle}>
              {TEXT.INFO_HOW_TITLE}
            </Title>
            <Text className={styles.infoText}>{TEXT.INFO_HOW_TEXT}</Text>
            <div className={styles.infoList}>
              {TEXT.INFO_HOW_EXAMPLES.map((example, idx) => (
                <Text key={idx}>• {example}</Text>
              ))}
            </div>
          </div>

          <div className={styles.infoSection}>
            <Title level="H6" className={styles.infoSectionTitle}>
              {TEXT.INFO_MANAGING_TITLE}
            </Title>
            <Text className={styles.infoText}>{TEXT.INFO_MANAGING_TEXT}</Text>
            <div className={styles.infoList}>
              {TEXT.INFO_MANAGING_ITEMS.map((item, idx) => (
                <div key={idx} className={styles.infoListItem}>
                  <Text className={styles.infoListLabel}>{item.label}</Text>
                  <Text>{item.text}</Text>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoTipBox}>
            <div className={styles.infoTipContent}>
              <Icon name={ICONS.HINT} className={styles.infoTipIcon} />
              <Text>
                <Text style={{ fontWeight: '600' }}>{TEXT.INFO_TIP_LABEL}</Text>{' '}
                {TEXT.INFO_TIP_TEXT}
              </Text>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Options Dialog */}
      <Dialog
        open={optionsManager.optionsPopupOpen}
        headerText={selectedAttributeName}
        style={{ width: DIALOG.OPTIONS.WIDTH, height: DIALOG.OPTIONS.HEIGHT }}
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Transparent" onClick={optionsManager.closePopup}>
                {TEXT.BUTTON_CLOSE}
              </Button>
            }
          />
        }
      >
        <div className={styles.optionsDialogContent}>
          <div className={styles.optionsHeader}>
            <Button
              design="Transparent"
              icon={ICONS.ADD}
              onClick={optionsManager.startAddNewOption}
            >
              {TEXT.ACTION_ADD_OPTION}
            </Button>
          </div>

          <div className={styles.optionsList}>
            {/* Add New Option Row */}
            {optionsManager.addingNewOption && (
              <div className={styles.addNewRow}>
                <Input
                  value={optionsManager.newOptionValue}
                  onInput={(e: any) => optionsManager.setNewOptionValue(e.target.value)}
                  placeholder={TEXT.PLACEHOLDER_OPTION_VALUE}
                  className={styles.addNewInput}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter') optionsManager.addNewOption();
                    if (e.key === 'Escape') optionsManager.cancelAddNewOption();
                  }}
                />
                <Button design="Emphasized" onClick={optionsManager.addNewOption}>
                  {TEXT.ACTION_ADD}
                </Button>
                <Button design="Transparent" onClick={optionsManager.cancelAddNewOption}>
                  {TEXT.ACTION_CANCEL}
                </Button>
              </div>
            )}

            {/* Option Rows */}
            {currentOptions.map((option, index) => {
              const isEditing = optionsManager.editingOption === index;

              return (
                <div key={index} className={styles.optionItem}>
                  {isEditing ? (
                    <>
                      <Input
                        value={optionsManager.editingOptionValue}
                        onInput={(e: any) => optionsManager.setEditingOptionValue(e.target.value)}
                        className={styles.optionEditInput}
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter') optionsManager.saveOptionEdit(index);
                          if (e.key === 'Escape') optionsManager.cancelOptionEdit();
                        }}
                      />
                      <div className={styles.optionActions}>
                        <Button
                          design="Emphasized"
                          onClick={() => optionsManager.saveOptionEdit(index)}
                        >
                          {TEXT.ACTION_SAVE}
                        </Button>
                        <Button design="Transparent" onClick={optionsManager.cancelOptionEdit}>
                          {TEXT.ACTION_CANCEL}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Text className={styles.optionText}>{option}</Text>
                      <div className={styles.optionActions}>
                        <Button
                          design="Transparent"
                          icon={ICONS.EDIT}
                          onClick={() => optionsManager.startEditOption(index, option)}
                        />
                        <Button
                          design="Transparent"
                          icon={ICONS.DELETE}
                          onClick={() => optionsManager.deleteOption(index)}
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
