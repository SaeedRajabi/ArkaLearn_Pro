'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRoomBySlug, getRoomById } from '@/services/room-service';
import type { RoomDetail } from '@/services/room-service';
import type { SeminarRoom, SeminarUser } from '@/lib/types';
import { RoomEntryPoint } from '@/components/seminar/room-entry-point';
import { RoomOwnerBootstrap } from '@/components/seminar/room-owner-bootstrap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useSeminar } from '@/contexts/seminar-context';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';

const ACTIVE_STATUS = 1;

function mapRoomDetailToSeminarRoom(d: RoomDetail): SeminarRoom {
  const seatIds = (d.assignedRoomUserIds ?? []).map((n) => String(n));
  return {
    id: String(d.roomId),
    name: d.title ?? '',
    organizerId: String(d.userId),
    participants: seatIds,
    participantRoles: {
      [String(d.userId)]: 'organizer',
      [`client-${d.userId}`]: 'organizer',
    },
    allowGuests: d.hasLinkedSeminar ? false : d.isGuest,
    requiresSeminarRegistration: d.hasLinkedSeminar ?? false,
    linkedSeminarId: d.linkedSeminarId == null ? null : String(d.linkedSeminarId),
    duration: d.maxSessionTime,
    guestLimit: d.guestQuantity,
    teacherEntersFirst: d.teacherEntersFirst ?? false,
    slug: d.slug ?? null,
  };
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginForRoom } = useSeminar();
  const segment = (params?.slug as string) ?? '';
  const [roomDetail, setRoomDetail] = useState<RoomDetail | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!segment) {
      setRoomDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const numeric = /^\d+$/.test(segment);
    (numeric ? getRoomById(Number(segment)) : getRoomBySlug(segment))
      .then((r) => {
        setRoomDetail(r ?? null);
      })
      .catch(() => setRoomDetail(null))
      .finally(() => setLoading(false));
  }, [segment]);

  useEffect(() => {
    if (loading || roomDetail === undefined || roomDetail === null) return;
    if (roomDetail.status !== ACTIVE_STATUS) return;

    const token = searchParams.get('roomToken');
    const userId = searchParams.get('roomUserId');
    if (!token || !userId) return;

    const userName = searchParams.get('roomUserName') || userId;
    const displayName = searchParams.get('roomDisplayName') || userName;
    const email = searchParams.get('roomEmail') || (userName.includes('@') ? userName : `${userName}@room.local`);
    const avatarParam = searchParams.get('roomAvatar');
    const avatar = avatarParam
      ? resolveUserAvatarUrl(avatarParam)
      : resolveUserAvatarUrl(null);

    const seminarUser: SeminarUser = {
      id: userId,
      name: displayName,
      displayName,
      username: userName,
      email,
      emailVerified: true,
      role: 'participant',
      avatar,
      roomAccessToken: token,
      isRoomSeatLogin: true,
    };

    loginForRoom(seminarUser);
    router.replace(`/room/${segment}`);
  }, [loading, loginForRoom, roomDetail, router, searchParams, segment]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roomDetail == null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-muted-foreground">اتاق یافت نشد.</p>
        </div>
      </div>
    );
  }

  if (roomDetail.status !== ACTIVE_STATUS) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto rounded-full bg-destructive/20 p-3 text-destructive w-fit">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <CardTitle className="mt-4">این کلاس منقضی و غیر فعال شده</CardTitle>
            <CardDescription>
              این اتاق در حال حاضر غیرفعال است و امکان ورود به آن وجود ندارد.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="mt-6">
              <Link href="https://arkasoftware.ir">بازگشت</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const room = mapRoomDetailToSeminarRoom(roomDetail);
  return (
    <RoomOwnerBootstrap room={room}>
      <RoomEntryPoint room={room} />
    </RoomOwnerBootstrap>
  );
}
