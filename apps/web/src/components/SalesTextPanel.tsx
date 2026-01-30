import { useState, useCallback } from 'react';
import { Panel, Text, Button, BusyIndicator, Icon, MessageStrip } from '@ui5/webcomponents-react';
import ReactMarkdown from 'react-markdown';
import '@ui5/webcomponents-icons/dist/marketing-campaign.js';
import '@ui5/webcomponents-icons/dist/synchronize.js';
import '@ui5/webcomponents-icons/dist/copy.js';
import '@ui5/webcomponents-icons/dist/camera.js';
import { fetchAPI } from '../services/api/client';
import styles from '../styles/components/SalesTextPanel.module.css';

type SalesTextStatus = 'pending' | 'generating' | 'completed' | 'failed';

interface SalesTextPanelProps {
  projectId: string;
  designId: string;
  salesText: string | null;
  salesTextGenerationStatus: SalesTextStatus | null;
  onSalesTextUpdate?: (salesText: string, status: SalesTextStatus) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  imageGenerationStatus?: string; // Add this to detect if images are completed
}

const SalesTextPanel: React.FC<SalesTextPanelProps> = ({
  projectId,
  designId,
  salesText,
  salesTextGenerationStatus,
  onSalesTextUpdate,
  collapsed = false,
  onToggle,
  imageGenerationStatus,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copyNotification, setCopyNotification] = useState<{
    show: boolean;
    success: boolean;
  } | null>(null);

  // Get current status
  const currentStatus = salesTextGenerationStatus || 'pending';
  const hasText = salesText && salesText.trim().length > 0;

  // Auto-detect if we should include image context based on completion status
  const includeImage = imageGenerationStatus === 'completed';

  // Handle regenerate sales text
  const handleRegenerate = useCallback(async () => {
    if (!projectId || !designId || isRegenerating) return;

    try {
      setIsRegenerating(true);

      // Update status immediately for UI feedback
      onSalesTextUpdate?.(salesText || '', 'generating');

      const result = await fetchAPI<{
        success: boolean;
        salesText: string;
        includedImage: boolean;
      }>(`/api/projects/${projectId}/generated-designs/${designId}/regenerate-sales-text`, {
        method: 'POST',
        body: JSON.stringify({ includeImage }),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data?.success && result.data.salesText) {
        onSalesTextUpdate?.(result.data.salesText, 'completed');
      } else {
        onSalesTextUpdate?.(salesText || '', 'failed');
      }
    } catch (error) {
      console.error('Failed to regenerate sales text:', error);
      onSalesTextUpdate?.(salesText || '', 'failed');
    } finally {
      setIsRegenerating(false);
    }
  }, [projectId, designId, includeImage, isRegenerating, salesText, onSalesTextUpdate]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!hasText) return;

    try {
      await navigator.clipboard.writeText(salesText!);
      setCopyNotification({ show: true, success: true });

      // Auto-dismiss after 2 seconds
      setTimeout(() => setCopyNotification(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyNotification({ show: true, success: false });
      setTimeout(() => setCopyNotification(null), 2000);
    }
  }, [hasText, salesText]);

  // Render status indicator
  const renderStatusIndicator = () => {
    switch (currentStatus) {
      case 'pending':
        return (
          <div className={styles.statusContainer}>
            <Text className={styles.statusText}>Sales text generation queued...</Text>
          </div>
        );
      case 'generating':
        return (
          <div className={styles.statusContainer}>
            <BusyIndicator active size="S" className={styles.statusLoader} />
            <Text className={styles.statusText}>
              {includeImage
                ? 'Generating sales text with image context...'
                : 'Generating sales text...'}
            </Text>
          </div>
        );
      case 'failed':
        return (
          <div className={styles.statusContainer}>
            <Text className={styles.statusTextError}>Failed to generate sales text</Text>
          </div>
        );
      case 'completed':
      default:
        if (!hasText) {
          return (
            <div className={styles.statusContainer}>
              <Text className={styles.statusTextEmpty}>No sales text available</Text>
            </div>
          );
        }
        return null;
    }
  };

  return (
    <Panel
      header={
        <div className={styles.panelHeader}>
          <Icon name="marketing-campaign" className={styles.panelIcon} />
          <Text className={styles.panelTitle}>Sales Text</Text>
          <div className={styles.panelActions}>
            {hasText && (
              <Button
                icon="copy"
                design="Transparent"
                tooltip="Copy to clipboard"
                onClick={handleCopy}
                className={styles.copyButton}
              />
            )}
            <Button
              icon="synchronize"
              design="Default"
              tooltip="Regenerate sales text"
              onClick={handleRegenerate}
              disabled={isRegenerating || currentStatus === 'generating'}
              className={styles.regenerateButton}
            >
              Regenerate
            </Button>
          </div>
        </div>
      }
      collapsed={collapsed}
      onToggle={onToggle}
      className={styles.salesTextPanel}
    >
      <div className={styles.panelContent}>
        {/* Copy notification */}
        {copyNotification?.show && (
          <div className={styles.notification}>
            <MessageStrip
              design={copyNotification.success ? 'Positive' : 'Negative'}
              onClose={() => setCopyNotification(null)}
            >
              {copyNotification.success
                ? 'Sales text copied to clipboard!'
                : 'Failed to copy to clipboard'}
            </MessageStrip>
          </div>
        )}

        {/* Status indicator or sales text content */}
        {renderStatusIndicator()}

        {hasText && currentStatus === 'completed' && (
          <div className={styles.salesTextContent}>
            <div className={styles.salesTextBody}>
              <ReactMarkdown>{salesText}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
};

export default SalesTextPanel;
