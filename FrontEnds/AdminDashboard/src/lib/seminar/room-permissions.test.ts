import {
  applyGrantChange,
  canShareScreen,
  canUseCamera,
  canUseMic,
  defaultGrants,
  grantsAfterRoleChange,
  isHostRole,
  revokedMedia,
  type ParticipantGrants,
} from './room-permissions';

describe('room-permissions', () => {
  describe('defaultGrants', () => {
    it('starts students with everything revoked (viewer-only)', () => {
      expect(defaultGrants()).toEqual({ voice: false, video: false, presenter: false });
    });
  });

  describe('isHostRole', () => {
    it.each(['organizer', 'admin'])('treats %s as host', (role) => {
      expect(isHostRole(role)).toBe(true);
    });

    it.each(['presenter', 'participant', ''])('treats %s as non-host', (role) => {
      expect(isHostRole(role)).toBe(false);
    });
  });

  describe('grantsAfterRoleChange', () => {
    it('grants everything on presenter promotion', () => {
      expect(grantsAfterRoleChange('presenter')).toEqual({
        voice: true,
        video: true,
        presenter: true,
      });
    });

    it('revokes everything on demotion to participant', () => {
      const before: ParticipantGrants = { voice: true, video: true, presenter: true };
      const after = applyGrantChange(before, grantsAfterRoleChange('participant'));
      expect(after).toEqual({ voice: false, video: false, presenter: false });
    });
  });

  describe('canUseMic / canUseCamera / canShareScreen', () => {
    const student: ParticipantGrants = defaultGrants();
    const voiceOnly: ParticipantGrants = { voice: true, video: false, presenter: false };
    const presenter: ParticipantGrants = { voice: true, video: true, presenter: true };

    it('blocks students without grants', () => {
      expect(canUseMic('participant', student)).toBe(false);
      expect(canUseCamera('participant', student)).toBe(false);
      expect(canShareScreen('participant', student)).toBe(false);
    });

    it('allows exactly the granted capability', () => {
      expect(canUseMic('participant', voiceOnly)).toBe(true);
      expect(canUseCamera('participant', voiceOnly)).toBe(false);
      expect(canShareScreen('participant', voiceOnly)).toBe(false);
    });

    it('allows presenters everything', () => {
      expect(canUseMic('participant', presenter)).toBe(true);
      expect(canUseCamera('participant', presenter)).toBe(true);
      expect(canShareScreen('participant', presenter)).toBe(true);
    });

    it('allows hosts without grants', () => {
      expect(canUseMic('organizer')).toBe(true);
      expect(canUseCamera('admin')).toBe(true);
      expect(canShareScreen('organizer')).toBe(true);
    });

    it('allows the legacy presenter role without grants', () => {
      expect(canUseMic('presenter')).toBe(true);
      expect(canUseCamera('presenter')).toBe(true);
      expect(canShareScreen('presenter')).toBe(true);
    });
  });

  describe('applyGrantChange', () => {
    it('applies partial changes without touching other flags', () => {
      const current: ParticipantGrants = { voice: true, video: false, presenter: false };
      expect(applyGrantChange(current, { video: true })).toEqual({
        voice: true,
        video: true,
        presenter: false,
      });
      expect(applyGrantChange(current, { voice: false })).toEqual({
        voice: false,
        video: false,
        presenter: false,
      });
    });

    it('rapid toggling: last change wins per flag', () => {
      let g: ParticipantGrants = defaultGrants();
      g = applyGrantChange(g, { voice: true });
      g = applyGrantChange(g, { voice: false });
      g = applyGrantChange(g, { voice: true });
      expect(g.voice).toBe(true);
    });
  });

  describe('revokedMedia (revocation enforcement)', () => {
    it('force-stops only active media whose permission was revoked', () => {
      const revoked = revokedMedia(
        'participant',
        { voice: false, video: false, presenter: false },
        { mic: true, camera: true, screen: true }
      );
      expect(revoked).toEqual(['mic', 'camera', 'screen']);
    });

    it('keeps media that is still permitted', () => {
      const revoked = revokedMedia(
        'participant',
        { voice: true, video: false, presenter: false },
        { mic: true, camera: true, screen: true }
      );
      expect(revoked).toEqual(['camera', 'screen']);
    });

    it('never revokes host media', () => {
      const revoked = revokedMedia(
        'organizer',
        defaultGrants(),
        { mic: true, camera: true, screen: true }
      );
      expect(revoked).toEqual([]);
    });

    it('ignores media that was never active', () => {
      const revoked = revokedMedia(
        'participant',
        defaultGrants(),
        { mic: false, camera: false, screen: false }
      );
      expect(revoked).toEqual([]);
    });
  });
});
