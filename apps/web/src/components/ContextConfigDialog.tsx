/**
 * Context Configuration Dialog Component
 * Modal dialog for configuring context items before project creation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  Button,
  Input,
  Text,
  Title,
  Slider,
  BusyIndicator,
} from '@ui5/webcomponents-react';
import { CONTEXT_CONFIG, BUTTONS } from '../constants/contextBuilder';
import styles from '../styles/components/ContextConfigDialog.module.css';

export interface ContextConfigValues {
  totalItems: number;
  topPercentage: number;
}

interface ContextConfigDialogProps {
  open: boolean;
  totalAvailable: number;
  onClose: () => void;
  onConfirm: (config: ContextConfigValues) => void;
  isCreating?: boolean;
}

export function ContextConfigDialog({
  open,
  totalAvailable,
  onClose,
  onConfirm,
  isCreating = false,
}: ContextConfigDialogProps) {
  // Calculate the effective maximum (capped at MAX_ITEMS or totalAvailable)
  const effectiveMax = Math.min(totalAvailable, CONTEXT_CONFIG.MAX_ITEMS);

  // Calculate default items based on available
  const defaultItems = Math.min(CONTEXT_CONFIG.DEFAULT_ITEMS, totalAvailable);

  // State for configuration
  const [totalItems, setTotalItems] = useState(defaultItems);
  const [topPercentage, setTopPercentage] = useState<number>(CONTEXT_CONFIG.DEFAULT_TOP_PERCENTAGE);

  // Input field values (for controlled input that allows typing)
  const [totalItemsInput, setTotalItemsInput] = useState(String(defaultItems));
  const [topPercentageInput, setTopPercentageInput] = useState(String(CONTEXT_CONFIG.DEFAULT_TOP_PERCENTAGE));

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const defaultVal = Math.min(CONTEXT_CONFIG.DEFAULT_ITEMS, totalAvailable);
      setTotalItems(defaultVal);
      setTotalItemsInput(String(defaultVal));
      setTopPercentage(CONTEXT_CONFIG.DEFAULT_TOP_PERCENTAGE);
      setTopPercentageInput(String(CONTEXT_CONFIG.DEFAULT_TOP_PERCENTAGE));
    }
  }, [open, totalAvailable]);

  // Calculate top and worst counts
  const topCount = useMemo(() => Math.round(totalItems * topPercentage / 100), [totalItems, topPercentage]);
  const worstCount = useMemo(() => totalItems - topCount, [totalItems, topCount]);

  // Get available presets (filter out those larger than available)
  const availablePresets = useMemo(() => {
    return CONTEXT_CONFIG.PRESETS.filter(preset => preset <= effectiveMax);
  }, [effectiveMax]);

  // Check if current value matches a preset
  const isPresetSelected = useCallback((preset: number) => {
    return totalItems === preset;
  }, [totalItems]);

  // Check if "All" is selected
  const isAllSelected = totalItems === totalAvailable;

  // Handle preset button click
  const handlePresetClick = useCallback((preset: number) => {
    setTotalItems(preset);
    setTotalItemsInput(String(preset));
  }, []);

  // Handle "All" button click
  const handleAllClick = useCallback(() => {
    const allValue = Math.min(totalAvailable, CONTEXT_CONFIG.MAX_ITEMS);
    setTotalItems(allValue);
    setTotalItemsInput(String(allValue));
  }, [totalAvailable]);

  // Handle slider change for total items
  const handleTotalItemsSliderChange = useCallback((e: any) => {
    const value = Number(e.target.value);
    setTotalItems(value);
    setTotalItemsInput(String(value));
  }, []);

  // Handle input change for total items
  const handleTotalItemsInputChange = useCallback((e: CustomEvent) => {
    const inputValue = (e.target as HTMLInputElement).value;
    setTotalItemsInput(inputValue);

    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(CONTEXT_CONFIG.MIN_ITEMS, Math.min(effectiveMax, numValue));
      setTotalItems(clampedValue);
    }
  }, [effectiveMax]);

  // Handle input blur for total items (clamp and format)
  const handleTotalItemsInputBlur = useCallback(() => {
    setTotalItemsInput(String(totalItems));
  }, [totalItems]);

  // Handle slider change for distribution
  const handleDistributionSliderChange = useCallback((e: any) => {
    const value = Number(e.target.value);
    setTopPercentage(value);
    setTopPercentageInput(String(value));
  }, []);

  // Handle input change for distribution
  const handleDistributionInputChange = useCallback((e: CustomEvent) => {
    const inputValue = (e.target as HTMLInputElement).value;
    setTopPercentageInput(inputValue);

    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(100, numValue));
      setTopPercentage(clampedValue);
    }
  }, []);

  // Handle input blur for distribution (clamp and format)
  const handleDistributionInputBlur = useCallback(() => {
    setTopPercentageInput(String(topPercentage));
  }, [topPercentage]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirm({
      totalItems,
      topPercentage,
    });
  }, [totalItems, topPercentage, onConfirm]);

  return (
    <Dialog
      open={open}
      headerText="Create Project"
      className={styles.dialog}
      footer={
        <div className={styles.dialogFooter}>
          <Button onClick={onClose} disabled={isCreating}>
            {BUTTONS.CANCEL}
          </Button>
          <Button
            design="Emphasized"
            onClick={handleConfirm}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <BusyIndicator active size="S" className={styles.loadingSpinner} />
                {BUTTONS.CREATING_PROJECT}
              </>
            ) : (
              BUTTONS.CREATE_PROJECT
            )}
          </Button>
        </div>
      }
    >
      <div className={styles.dialogContent}>
        <Title level="H5" className={styles.sectionTitle}>Context Configuration</Title>

        {/* Context Items Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text className={styles.label}>Context Items</Text>
            <Text className={styles.availableText}>/ {totalAvailable.toLocaleString()} available</Text>
          </div>

          {/* Quick Select Buttons */}
          <div className={styles.presetsContainer}>
            <Text className={styles.presetsLabel}>Quick select:</Text>
            <div className={styles.presetButtons}>
              {availablePresets.map((preset) => (
                <Button
                  key={preset}
                  design={isPresetSelected(preset) ? 'Emphasized' : 'Default'}
                  onClick={() => handlePresetClick(preset)}
                  className={styles.presetButton}
                  disabled={isCreating}
                >
                  {preset}
                </Button>
              ))}
              <Button
                design={isAllSelected ? 'Emphasized' : 'Default'}
                onClick={handleAllClick}
                className={styles.presetButton}
                disabled={isCreating}
              >
                {BUTTONS.ALL}
              </Button>
            </div>
          </div>

          {/* Slider + Input */}
          <div className={styles.sliderRow}>
            <Slider
              value={totalItems}
              min={CONTEXT_CONFIG.MIN_ITEMS}
              max={effectiveMax}
              onChange={handleTotalItemsSliderChange}
              className={styles.slider}
              disabled={isCreating}
            />
            <Input
              value={totalItemsInput}
              onInput={handleTotalItemsInputChange}
              onBlur={handleTotalItemsInputBlur}
              className={styles.sliderInput}
              disabled={isCreating}
            />
          </div>
          <div className={styles.sliderLabels}>
            <Text className={styles.sliderLabelMin}>{CONTEXT_CONFIG.MIN_ITEMS}</Text>
            <Text className={styles.sliderLabelMax}>{effectiveMax.toLocaleString()}</Text>
          </div>
        </div>

        {/* Distribution Section */}
        <div className={styles.section}>
          <Text className={styles.label}>Distribution</Text>

          {/* Slider + Input */}
          <div className={styles.sliderRow}>
            <Slider
              value={topPercentage}
              min={0}
              max={100}
              onChange={handleDistributionSliderChange}
              className={styles.slider}
              disabled={isCreating}
            />
            <div className={styles.percentageInputWrapper}>
              <Input
                value={topPercentageInput}
                onInput={handleDistributionInputChange}
                onBlur={handleDistributionInputBlur}
                className={styles.percentageInput}
                disabled={isCreating}
              />
              <Text className={styles.percentageSymbol}>%</Text>
            </div>
          </div>
          <div className={styles.sliderLabels}>
            <Text className={styles.sliderLabelMin}>0%</Text>
            <Text className={styles.sliderLabelMax}>100%</Text>
          </div>

          {/* Distribution Preview */}
          <div className={styles.distributionPreview}>
            <Text className={styles.distributionItem}>
              <span className={styles.distributionLabel}>Top Performers:</span>{' '}
              <span className={styles.distributionValue}>{topCount} ({topPercentage}%)</span>
            </Text>
            <Text className={styles.distributionDivider}>|</Text>
            <Text className={styles.distributionItem}>
              <span className={styles.distributionLabel}>Worst Performers:</span>{' '}
              <span className={styles.distributionValue}>{worstCount} ({100 - topPercentage}%)</span>
            </Text>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
