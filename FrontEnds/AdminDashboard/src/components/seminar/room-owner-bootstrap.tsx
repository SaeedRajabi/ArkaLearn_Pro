'use client';



import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';

import { useSeminar } from '@/contexts/seminar-context';

import type { SeminarRoom, SeminarUser } from '@/lib/types';

import { issueStaffJoinTicket } from '@/services/room-service';

import { useLanguage } from '@/components/language-provider';

import { isAdminDashboardRole } from '@/lib/auth/dashboard-access';

import type { AuthUser } from '@/lib/auth/types';

import { persistRoomJoinTicket } from '@/lib/room-join-ticket';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';



function buildStaffSeminarUser(room: SeminarRoom, authUser: AuthUser, joinTicket: string): SeminarUser {

  const isOwner = String(authUser.id) === String(room.organizerId);

  const role = authUser.roleName === 'admin' && !isOwner ? 'admin' : 'organizer';

  return {

    id: String(authUser.id),

    name: authUser.name,

    displayName: authUser.name || authUser.userName,

    username: authUser.userName || authUser.email.split('@')[0],

    email: authUser.email,

    emailVerified: true,

    role,

    avatar: resolveUserAvatarUrl(authUser.avatarUrl),

    roomJoinTicket: joinTicket,

  };

}



/**

 * Auto-issues a staff join ticket when a signed-in dashboard teacher/admin opens a room.

 * Anonymous students must not wait on dashboard session verification.

 */

export function RoomOwnerBootstrap({

  room,

  children,

}: {

  room: SeminarRoom;

  children: React.ReactNode;

}) {

  const { t } = useLanguage();

  const { authUser, sessionVerified, initialized } = useAuth();

  const { user, loginForRoom } = useSeminar();

  const [ready, setReady] = useState(false);



  useEffect(() => {

    if (user?.isRoomSeatLogin || user?.roomJoinTicket) {

      setReady(true);

      return;

    }



    if (!initialized) {

      setReady(false);

      return;

    }



    const isStaff = authUser != null && isAdminDashboardRole(authUser.roleName);

    if (!isStaff) {
      setReady(true);
      return;
    }

    if (!sessionVerified) {
      setReady(false);
      return;
    }

    const isOwner = String(authUser.id) === String(room.organizerId);
    const canAutoEnter = isOwner || authUser.roleName === 'admin';
    if (!canAutoEnter) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { joinTicket } = await issueStaffJoinTicket(Number(room.id));
        if (cancelled) return;
        persistRoomJoinTicket(joinTicket);
        loginForRoom(buildStaffSeminarUser(room, authUser, joinTicket));
      } catch (error) {
        console.error('RoomOwnerBootstrap issueStaffJoinTicket failed:', error);
        /* Staff can still use the room login form — do not block students/guests. */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();



    return () => {

      cancelled = true;

    };

  }, [

    user?.isRoomSeatLogin,

    user?.roomJoinTicket,

    initialized,

    sessionVerified,

    authUser,

    room.id,

    room.organizerId,

    loginForRoom,

  ]);



  if (!ready) {

    return (

      <div className="flex h-screen items-center justify-center">

        <p>{t('loading')}</p>

      </div>

    );

  }



  return <>{children}</>;

}

