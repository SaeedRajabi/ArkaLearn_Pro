'use client';

import { MediaLibraryModal } from './MediaLibraryModal';
import type { MediaAcceptType } from './MediaLibraryModal';
import type { MediaSelection } from '@/lib/api/media';
import type { Dictionary } from '@/types';

type Props = {
  dict: Dictionary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaSelection) => void;
  acceptTypes?: MediaAcceptType[];
  multiple?: boolean;
};

export function MediaPickerDialog({
  dict,
  open,
  onOpenChange,
  onSelect,
  acceptTypes = ['image'],
}: Props) {
  return (
    <MediaLibraryModal
      dict={dict}
      open={open}
      onOpenChange={onOpenChange}
      mode="pick"
      onSelect={onSelect}
      acceptTypes={acceptTypes}
    />
  );
}

export type { MediaAcceptType };
