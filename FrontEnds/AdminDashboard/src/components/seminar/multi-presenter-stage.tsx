'use client';

import React, { useMemo, useState } from 'react';
import { PublisherStageTile } from './publisher-stage-tile';
import {
  partitionStagePublishers,
  stageGridMode,
  type StagePublisherInfo,
} from '@/lib/seminar-room-layout';
import type { WebcamOverlayStylePayload } from '@/lib/seminar-webcam-overlay';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';

export type StageTileMedia = {
  connectionId: string;
  userName: string;
  isLocal: boolean;
  isTeacher: boolean;
  hasScreen: boolean;
  hasCamera: boolean;
  screenStream: MediaStream | null;
  screenTracks: MediaStreamTrack[] | null;
  cameraStream: MediaStream | null;
  cameraTracks: MediaStreamTrack[] | null;
  overlayStyle: WebcamOverlayStylePayload;
  imageFilter?: { brightness: number; contrast: number; touchUp?: boolean };
  pipPos?: { x: number; y: number };
  pipSize?: { width: number; height: number };
  isSpeaking?: boolean;
};

type MultiPresenterStageProps = {
  tiles: StageTileMedia[];
  className?: string;
};

export function MultiPresenterStage({ tiles, className }: MultiPresenterStageProps) {
  const { t } = useLanguage();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const infos: StagePublisherInfo[] = useMemo(
    () =>
      tiles.map((t) => ({
        connectionId: t.connectionId,
        userName: t.userName,
        isLocal: t.isLocal,
        isTeacher: t.isTeacher,
        hasScreen: t.hasScreen,
        hasCamera: t.hasCamera,
      })),
    [tiles]
  );

  const mode = stageGridMode(tiles.length);
  const { teachers, students } = partitionStagePublishers(infos);
  const tileById = useMemo(() => new Map(tiles.map((t) => [t.connectionId, t])), [tiles]);

  const renderTile = (info: StagePublisherInfo) => {
    const media = tileById.get(info.connectionId);
    if (!media) return null;
    return (
      <PublisherStageTile
        key={media.connectionId}
        connectionId={media.connectionId}
        userName={media.userName}
        label={
          media.hasScreen
            ? t('seminar_presenter_screen_live')
            : media.hasCamera
              ? t('seminar_teacher_camera_live')
              : undefined
        }
        screenStream={media.screenStream}
        screenTracks={media.screenTracks}
        cameraStream={media.cameraStream}
        cameraTracks={media.cameraTracks}
        showCamera={media.hasCamera}
        overlayStyle={media.overlayStyle}
        imageFilter={media.imageFilter}
        pipPos={media.pipPos}
        pipSize={media.pipSize}
        isSpeaking={media.isSpeaking}
        isPinned={pinnedId === media.connectionId}
        onTogglePin={() => setPinnedId((current) => current === media.connectionId ? null : media.connectionId)}
      />
    );
  };

  const pinned = pinnedId ? infos.find((info) => info.connectionId === pinnedId) : null;
  if (pinned) {
    const rail = infos.filter((info) => info.connectionId !== pinned.connectionId);
    return (
      <div className={cn('flex h-full w-full min-h-0 flex-col gap-1', className)}>
        <div className="min-h-0 flex-1">{renderTile(pinned)}</div>
        {rail.length > 0 && (
          <div className="flex h-28 shrink-0 gap-1 overflow-x-auto md:h-36">
            {rail.map((info) => (
              <div key={`stage-rail-${info.connectionId}`} className="aspect-video h-full shrink-0">
                {renderTile(info)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'solo') {
    return (
      <div className={cn('relative h-full w-full', className)}>
        {infos[0] ? renderTile(infos[0]) : null}
      </div>
    );
  }

  if (mode === 'split2') {
    return (
      <div
        className={cn(
          'grid h-full w-full gap-1',
          'grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1',
          className
        )}
      >
        {infos.map((info) => renderTile(info))}
      </div>
    );
  }

  const topCols = Math.max(1, teachers.length);
  const bottomCols = Math.max(1, students.length || 1);

  return (
    <div
      className={cn('grid h-full w-full gap-1', className)}
      style={{
        gridTemplateRows:
          students.length > 0 ? 'minmax(0, 1.1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
      }}
    >
      <div
        className="grid min-h-0 gap-1"
        style={{ gridTemplateColumns: `repeat(${topCols}, minmax(0, 1fr))` }}
      >
        {teachers.map((info) => renderTile(info))}
      </div>
      {students.length > 0 && (
        <div
          className="grid min-h-0 gap-1"
          style={{ gridTemplateColumns: `repeat(${bottomCols}, minmax(0, 1fr))` }}
        >
          {students.map((info) => renderTile(info))}
        </div>
      )}
    </div>
  );
}
