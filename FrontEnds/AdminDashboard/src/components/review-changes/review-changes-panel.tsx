'use client';

import * as React from 'react';
import { PlusCircle, MinusCircle, PencilLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buildWordDiff } from '@/lib/review-text-diff';
import styles from './review-changes-panel.module.css';

export type TeacherReviewFieldChange = {
  fieldKey: string;
  fieldLabel: string;
  previousText?: string | null;
  currentText?: string | null;
  changeKind: 'added' | 'removed' | 'modified' | string;
};

export type TeacherReviewChanges = {
  reviewType: string;
  teacherId: number;
  contentId: number;
  hasApprovedBaseline: boolean;
  changes: TeacherReviewFieldChange[];
};

type Props = {
  changes: TeacherReviewChanges | null;
  loading?: boolean;
  emptyLabel: string;
  newContentLabel: string;
  noBaselineLabel: string;
  changesTitle?: string;
  fieldLabel?: (fieldKey: string, fallback: string) => string;
};

function DiffText({
  previousText,
  currentText,
}: {
  previousText?: string | null;
  currentText?: string | null;
}) {
  const segments = React.useMemo(
    () => buildWordDiff(previousText, currentText),
    [previousText, currentText]
  );

  if (segments.length === 0) {
    return <p className={styles.emptyDiff}>—</p>;
  }

  return (
    <p className={styles.diffText}>
      {segments.map((segment, index) => (
        <span
          key={`${segment.type}-${index}`}
          className={
            segment.type === 'add'
              ? styles.diffAdd
              : segment.type === 'remove'
                ? styles.diffRemove
                : styles.diffSame
          }
        >
          {segment.text}
        </span>
      ))}
    </p>
  );
}

export function ReviewChangesPanel({
  changes,
  loading,
  emptyLabel,
  newContentLabel,
  noBaselineLabel,
  changesTitle = 'Change report',
  fieldLabel,
}: Props) {
  if (loading) {
    return <div className={styles.loading}>{emptyLabel}</div>;
  }

  if (!changes) return null;

  if (changes.changes.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.summary}>{changes.hasApprovedBaseline ? emptyLabel : newContentLabel}</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <PencilLine className="h-4 w-4" aria-hidden />
        <span>{changesTitle}</span>
        {!changes.hasApprovedBaseline ? (
          <Badge variant="secondary">{noBaselineLabel}</Badge>
        ) : (
          <Badge variant="outline">{changes.changes.length}</Badge>
        )}
      </div>

      <ul className={styles.list}>
        {changes.changes.map((change) => {
          const label = fieldLabel?.(change.fieldKey, change.fieldLabel) ?? change.fieldLabel;
          const kind = change.changeKind;
          return (
            <li key={change.fieldKey} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{label}</span>
                {kind === 'added' ? (
                  <Badge className={styles.badgeAdd}>
                    <PlusCircle className="h-3 w-3" aria-hidden />
                    added
                  </Badge>
                ) : kind === 'removed' ? (
                  <Badge className={styles.badgeRemove}>
                    <MinusCircle className="h-3 w-3" aria-hidden />
                    removed
                  </Badge>
                ) : (
                  <Badge variant="outline">modified</Badge>
                )}
              </div>
              <DiffText previousText={change.previousText} currentText={change.currentText} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
