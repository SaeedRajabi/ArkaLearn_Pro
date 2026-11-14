import {
  gridColumnCount,
  gridTemplateColumns,
  partitionTiles,
  resolveFocalPerson,
  type TileRef,
} from './room-grid';

function tiles(...ids: string[]): TileRef[] {
  return ids.map((connectionId) => ({ connectionId }));
}

describe('room-grid', () => {
  describe('gridColumnCount', () => {
    it.each([
      [0, 1],
      [1, 1],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 3],
      [9, 3],
      [10, 4],
      [16, 4],
    ])('uses %i columns for %i participants', (count, expected) => {
      expect(gridColumnCount(count)).toBe(expected);
    });

    it('produces a valid CSS grid template', () => {
      expect(gridTemplateColumns(2)).toBe('repeat(2, minmax(0, 1fr))');
    });
  });

  describe('resolveFocalPerson', () => {
    it('yields the pinned participant when no screen is shared', () => {
      expect(resolveFocalPerson({ screenFocal: false, pinned: 'peer-1' })).toBe('peer-1');
    });

    it('yields null when a screen share owns the stage', () => {
      expect(resolveFocalPerson({ screenFocal: true, pinned: 'peer-1' })).toBeNull();
    });

    it('yields null when nothing is pinned or shared', () => {
      expect(resolveFocalPerson({ screenFocal: false, pinned: null })).toBeNull();
    });
  });

  describe('partitionTiles', () => {
    it('keeps everyone in the grid when no screen is shared', () => {
      const list = tiles('self', 'a', 'b');
      const result = partitionTiles(list, {
        screenSharing: true,
        sharerConnectionId: 'self',
        selfConnectionId: 'self',
      });
      expect(result.grid).toEqual(list);
    });

    it('excludes the screen sharer from the strip (their cam shows as stage PiP)', () => {
      const list = tiles('self', 'sharer', 'b');
      const result = partitionTiles(list, {
        screenSharing: true,
        sharerConnectionId: 'sharer',
        selfConnectionId: 'self',
      });
      expect(result.strip.map((t) => t.connectionId)).toEqual(['self', 'b']);
    });

    it('keeps the self tile out of the strip when self is sharing', () => {
      const list = tiles('self', 'a');
      const result = partitionTiles(list, {
        screenSharing: true,
        sharerConnectionId: 'self',
        selfConnectionId: 'self',
      });
      expect(result.strip.map((t) => t.connectionId)).toEqual(['a']);
    });

    it('keeps everyone in the strip when someone else shares and self is not sharing', () => {
      const list = tiles('self', 'sharer', 'b');
      const result = partitionTiles(list, {
        screenSharing: true,
        sharerConnectionId: 'sharer',
        selfConnectionId: 'self',
      });
      expect(result.strip.map((t) => t.connectionId)).toEqual(['self', 'b']);
    });

    it('does not partition anything when no screen is shared', () => {
      const list = tiles('self', 'sharer');
      const result = partitionTiles(list, {
        screenSharing: false,
        sharerConnectionId: null,
        selfConnectionId: 'self',
      });
      expect(result.strip.map((t) => t.connectionId)).toEqual(['self', 'sharer']);
    });
  });
});
