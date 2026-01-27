/**
 * Mismatch Review Dialog Component
 * Modal for reviewing and excluding flagged articles with product type mismatches
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  Button,
  CheckBox,
  Text,
  MessageStrip,
  BusyIndicator,
  Icon,
  Bar,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/product.js';

import { getConfidenceLabel, API_ENDPOINTS } from '../constants/projectHub';
import { fetchAPI } from '../services/api/client';
import type { ContextItem } from '../types/enhancedTableTab';
import styles from '../styles/components/MismatchReviewDialog.module.css';

interface MismatchReviewDialogProps {
  open: boolean;
  projectId: string;
  items: ContextItem[];
  onClose: () => void;
  onConfirm: () => void;
}

const MismatchReviewDialog: React.FC<MismatchReviewDialogProps> = ({
  open,
  projectId,
  items,
  onClose,
  onConfirm,
}) => {
  // Filter to only flagged items (confidence >= 80)
  const flaggedItems = useMemo(
    () =>
      items.filter(
        (item) => item.mismatchConfidence !== null && item.mismatchConfidence >= 80
      ),
    [items]
  );

  // State to track exclusions (keyed by articleId)
  // Default: all flagged items are excluded (unchecked = excluded)
  const [exclusions, setExclusions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    flaggedItems.forEach((item) => {
      // Use the current isExcluded state as initial, or default to true (excluded)
      initial[item.articleId] = item.isExcluded ?? true;
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset exclusions when items change
  React.useEffect(() => {
    const newExclusions: Record<string, boolean> = {};
    flaggedItems.forEach((item) => {
      newExclusions[item.articleId] = item.isExcluded ?? true;
    });
    setExclusions(newExclusions);
  }, [flaggedItems]);

  const handleToggle = (articleId: string, isExcluded: boolean) => {
    setExclusions((prev) => ({
      ...prev,
      [articleId]: isExcluded,
    }));
  };

  const handleIncludeAll = () => {
    const updated: Record<string, boolean> = {};
    flaggedItems.forEach((item) => {
      updated[item.articleId] = false; // false = included
    });
    setExclusions(updated);
  };

  const handleExcludeAll = () => {
    const updated: Record<string, boolean> = {};
    flaggedItems.forEach((item) => {
      updated[item.articleId] = true; // true = excluded
    });
    setExclusions(updated);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const exclusionsList = Object.entries(exclusions).map(([articleId, isExcluded]) => ({
        articleId,
        isExcluded,
      }));

      await fetchAPI(API_ENDPOINTS.MISMATCH_REVIEW(projectId), {
        method: 'PATCH',
        body: JSON.stringify({ exclusions: exclusionsList }),
      });

      onConfirm();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save exclusions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const excludedCount = Object.values(exclusions).filter(Boolean).length;
  const includedCount = flaggedItems.length - excludedCount;

  return (
    <Dialog
      open={open}
      headerText="Review Flagged Articles"
      className={styles.dialog}
      footer={
        <Bar
          endContent={
            <div className={styles.footerButtons}>
              <Button onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                design="Emphasized"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <BusyIndicator active size="S" />
                    Saving...
                  </>
                ) : (
                  'Confirm Selection'
                )}
              </Button>
            </div>
          }
          startContent={
            <Text className={styles.summaryText}>
              {includedCount} included, {excludedCount} excluded
            </Text>
          }
        />
      }
    >
      <div className={styles.dialogContent}>
        {error && (
          <MessageStrip design="Negative" hideCloseButton className={styles.errorStrip}>
            {error}
          </MessageStrip>
        )}

        <div className={styles.description}>
          <Text>
            The following articles may not match the expected product type. Review and
            decide which to include in your analysis context.
          </Text>
        </div>

        <div className={styles.bulkActions}>
          <Button onClick={handleIncludeAll} disabled={loading}>
            Include All
          </Button>
          <Button onClick={handleExcludeAll} disabled={loading}>
            Exclude All
          </Button>
        </div>

        {flaggedItems.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No flagged articles to review.</Text>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.thInclude}>Include</th>
                  <th className={styles.thImage}>Image</th>
                  <th className={styles.thArticleId}>Article ID</th>
                  <th className={styles.thProductType}>Product Type</th>
                  <th className={styles.thConfidence}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {flaggedItems.map((item) => {
                  const confidenceInfo = getConfidenceLabel(item.mismatchConfidence);
                  const isExcluded = exclusions[item.articleId] ?? true;

                  return (
                    <tr
                      key={item.articleId}
                      className={`${styles.tableRow} ${isExcluded ? styles.rowExcluded : ''}`}
                    >
                      <td className={styles.tdInclude}>
                        <CheckBox
                          checked={!isExcluded}
                          onChange={() => handleToggle(item.articleId, !isExcluded)}
                          disabled={loading}
                        />
                      </td>
                      <td className={styles.tdImage}>
                        <div className={styles.thumbnailContainer}>
                          <img
                            src={item.imageUrl}
                            alt={item.articleId}
                            className={styles.thumbnail}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className={styles.fallbackIcon} style={{ display: 'none' }}>
                            <Icon name="product" />
                          </div>
                        </div>
                      </td>
                      <td className={styles.tdArticleId}>
                        <Text className={styles.articleIdText}>{item.articleId}</Text>
                      </td>
                      <td className={styles.tdProductType}>
                        <Text>{item.productType}</Text>
                      </td>
                      <td className={styles.tdConfidence}>
                        <span
                          className={styles.confidenceBadge}
                          style={{ backgroundColor: `${confidenceInfo.color}15`, color: confidenceInfo.color }}
                        >
                          {confidenceInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default React.memo(MismatchReviewDialog);
