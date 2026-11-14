'use client';

import { MediaLibraryModal } from './MediaLibraryModal';
import type { MediaAcceptType } from './MediaLibraryModal';
import type { MediaSelection } from '@/services/media-api.service';

const DEFAULT_PICK_ACCEPT_TYPES: MediaAcceptType[] = ['image'];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaSelection) => void;
  acceptTypes?: MediaAcceptType[];
  multiple?: boolean;
  isAdmin?: boolean;
  /** When true, video uploads stay public (no desktop DRM encrypt option). */
  preferPublicVideoUpload?: boolean;
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  acceptTypes = DEFAULT_PICK_ACCEPT_TYPES,
  isAdmin = true,
  preferPublicVideoUpload = false,
}: Props) {
  return (
    <MediaLibraryModal
      open={open}
      onOpenChange={onOpenChange}
      mode="pick"
      onSelect={onSelect}
      acceptTypes={acceptTypes}
      isAdmin={isAdmin}
      preferPublicVideoUpload={preferPublicVideoUpload}
    />
  );
}

export type { MediaAcceptType };
