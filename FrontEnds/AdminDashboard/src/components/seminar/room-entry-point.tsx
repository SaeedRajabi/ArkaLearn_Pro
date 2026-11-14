'use client';

import { useSeminar } from '@/contexts/seminar-context';
import type { SeminarRoom } from '@/lib/types';
import { OrganizerDeviceSetup } from './organizer-device-setup';
import { ParticipantLogin } from './participant-login';
import { useEffect, useState } from 'react';
import { SeminarRoomComponent } from './seminar-room';
import { useAuth } from '@/components/auth-provider';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';

type EffectiveRole = 'organizer' | 'admin' | 'presenter' | 'participant' | 'guest';

export function RoomEntryPoint({ room }: { room: SeminarRoom }) {
  const { t } = useLanguage();
  const { user } = useSeminar();
  const { loading: authLoading, initialized, authUser } = useAuth();
  const [role, setRole] = useState<EffectiveRole | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const organizerId = String(room.organizerId);

    let nextRole: EffectiveRole = 'guest';

    if (user?.isRoomSeatLogin) {
      const roomUserId = String(user.id);
      const legacyRoomUserId = `client-${roomUserId}`;
      if (room.participants.includes(roomUserId) || room.participants.includes(legacyRoomUserId)) {
        nextRole =
          (room.participantRoles[roomUserId] as EffectiveRole) ||
          (room.participantRoles[legacyRoomUserId] as EffectiveRole) ||
          'participant';
      } else {
        nextRole = 'participant';
      }
    } else if (authUser && (authUser.roleName === 'admin' || authUser.roleName === 'teacher') && user) {
      const roomUserId = String(user.id);
      if (roomUserId === organizerId) {
        nextRole = 'organizer';
      } else if (authUser.roleName === 'admin') {
        nextRole = 'admin';
      } else {
        nextRole = 'presenter';
      }
    } else if (user) {
      const roomUserId = String(user.id);
      const legacyRoomUserId = `client-${roomUserId}`;
      if (roomUserId === organizerId || user.role === 'organizer') {
        nextRole = 'organizer';
      } else if (user.role === 'admin') {
        nextRole = 'admin';
      } else if (user.role === 'presenter') {
        nextRole = 'presenter';
      } else if (user.role === 'guest') {
        nextRole = 'guest';
      } else if (user.role === 'participant' && user.isRoomSeatLogin) {
        nextRole = 'participant';
      } else if (
        room.participants.includes(roomUserId) ||
        room.participants.includes(legacyRoomUserId)
      ) {
        nextRole =
          (room.participantRoles[roomUserId] as EffectiveRole) ||
          (room.participantRoles[legacyRoomUserId] as EffectiveRole) ||
          'participant';
      }
    }

    setRole(nextRole);
    setIsVerified(true);
  }, [user, room, authUser]);

  const waitingForAuth = authLoading || !initialized;
  const waitingForRole = !isVerified;

  if (waitingForAuth || waitingForRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (user?.paymentPlan?.status === 'Suspended') {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/20 text-destructive rounded-full p-3 w-fit">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <CardTitle className="mt-4">{t('seminar_account_suspended_title')}</CardTitle>
            <CardDescription>
              {t('seminar_account_suspended_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('seminar_account_suspended_help')}
            </p>
            <Button asChild className="mt-6">
              <Link href="/">{t('seminar_return_to_login')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user && role) {
    if (role === 'participant' || role === 'guest') {
      return (
        <SeminarRoomComponent
          room={room}
          initialMicOn={false}
          initialCameraOn={false}
        />
      );
    }
    return (
      <OrganizerDeviceSetup
        room={room}
        userRole={role as 'organizer' | 'admin' | 'presenter'}
      />
    );
  }

  return <ParticipantLogin room={room} />;
}
