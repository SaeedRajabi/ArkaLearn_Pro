/**
 * Pure layout logic for the adaptive classroom video grid (Google Meet style).
 */

/** Column count for the uniform tile grid, based on visible participant count. */
export function gridColumnCount(participantCount: number): number {
  if (participantCount <= 1) return 1;
  if (participantCount <= 4) return 2;
  if (participantCount <= 9) return 3;
  return 4;
}

export function gridTemplateColumns(participantCount: number): string {
  return `repeat(${gridColumnCount(participantCount)}, minmax(0, 1fr))`;
}

export interface FocalDecision {
  /** True when a live screen share should occupy the hero stage. */
  screenFocal: boolean;
  /** Connection id of the pinned participant (ignored while screenFocal). */
  pinned: string | null;
}

/**
 * Resolves which participant (if any) occupies the enlarged focal view.
 * Priority: live screen share > pinned participant > none (uniform grid).
 * Returns null when the stage is owned by a screen share (not a person tile).
 */
export function resolveFocalPerson(decision: FocalDecision): string | null {
  if (decision.screenFocal) return null;
  return decision.pinned;
}

export interface TileRef {
  connectionId: string;
  isSelf?: boolean;
}

export interface PartitionedTiles<T extends TileRef> {
  /** Tiles shown in the strip below the focal view. */
  strip: T[];
  /** Tiles for the uniform grid (everyone, self included). */
  grid: T[];
}

/**
 * Splits participants into strip/grid collections for presentation mode.
 * `sharerConnectionId` — who is sharing the screen (their camera appears as a
 * PiP over the shared screen, so their tile is excluded from the strip).
 */
export function partitionTiles<T extends TileRef>(
  tiles: T[],
  options: {
    screenSharing: boolean;
    sharerConnectionId: string | null;
    selfConnectionId?: string | null;
  }
): PartitionedTiles<T> {
  const strip = tiles.filter((t) => {
    if (
      options.screenSharing &&
      options.sharerConnectionId &&
      t.connectionId === options.sharerConnectionId
    ) {
      return false;
    }
    return true;
  });

  return { strip, grid: tiles };
}
