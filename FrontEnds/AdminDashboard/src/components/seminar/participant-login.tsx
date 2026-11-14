'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { SeminarRoom, SeminarUser } from '@/lib/types';
import { useSeminar } from '@/contexts/seminar-context';
import { useAuth } from '@/components/auth-provider';
import { LoaderCircle } from 'lucide-react';
import { getCurrentUser, logout as authLogout } from '@/lib/auth/api';
import { useLanguage } from '@/components/language-provider';
import { isAdminDashboardRole } from '@/lib/auth/dashboard-access';
import type { AuthUser } from '@/lib/auth/types';
import {
  issueGuestJoinTicket,
  issueStaffJoinTicket,
  loginRoomUser,
  RoomLoginFailedError,
} from '@/services/room-service';
import { persistRoomJoinTicket } from '@/lib/room-join-ticket';
import { resolveStaticAssetUrl } from '@/lib/api-config';

export function ParticipantLogin({ room }: { room: SeminarRoom }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { loginForRoom } = useSeminar();
  const { login: siteLogin } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const loginSchema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, { message: t('seminar_username_required') }),
        password: z
          .string()
          .min(5, {
            message:
              t('seminar_room_password_min_length') ??
              'Password must be at least 5 characters (use the password your teacher set for this room).',
          }),
      }),
    [t]
  );

  const guestSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(1, { message: t('seminar_first_name_required') }),
        lastName: z.string().min(1, { message: t('seminar_last_name_required') }),
      }),
    [t]
  );

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const guestForm = useForm<z.infer<typeof guestSchema>>({
    resolver: zodResolver(guestSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  function mapRoomSeatLoginFailure(err: RoomLoginFailedError): string {
    if (err.httpStatus === undefined && err.serverMessages.length === 0) {
      return t('seminar_room_login_network');
    }
    const raw = (err.serverMessages[0] ?? err.message ?? '').trim();
    const text = raw.replace(/^Room login:\s*/i, '').trim();

    if (/not registered/i.test(raw)) {
      return t('seminar_room_login_not_in_room');
    }
    if (/must register for this seminar/i.test(raw)) {
      return t('seminar_room_login_not_registered_for_seminar');
    }
    if (/payment is required/i.test(raw)) {
      return t('seminar_room_login_payment_required');
    }
    if (/expired/i.test(raw)) {
      return t('seminar_room_login_expired');
    }
    if (/blocked/i.test(raw)) {
      return t('seminar_room_login_blocked_seat');
    }
    if (/already logged in|already active/i.test(raw)) {
      return t('seminar_room_login_already_logged_in');
    }
    if (/invalid username|invalid username\/email or password/i.test(raw)) {
      return t('seminar_room_login_invalid_credentials');
    }
    if (/username\/email and password are required/i.test(raw)) {
      return t('seminar_room_login_required_fields');
    }
    if (text.length > 0) {
      return text;
    }
    return t('seminar_room_login_generic');
  }

  function shouldAbortAfterRoomSeatFailure(err: RoomLoginFailedError): boolean {
    const raw = (err.serverMessages[0] ?? err.message ?? '').toLowerCase();
    return /already logged in|already active/.test(raw);
  }

  async function enterAsDashboardStaff(current: AuthUser, roomId: number): Promise<boolean> {
    const isRoomOwner = String(current.id) === String(room.organizerId);
    const isAdmin = current.roleName === 'admin';
    if (!isRoomOwner && !isAdmin) return false;

    const ticketRes = await issueStaffJoinTicket(roomId);
    persistRoomJoinTicket(ticketRes.joinTicket);
    const roomUserId = String(current.id);
    const seminarUser: SeminarUser = {
      id: roomUserId,
      name: current.name,
      displayName:
        current.initials || current.name.split(' ').filter(Boolean).map((n) => n[0]).join('.') || current.name,
      username: current.userName || current.email?.split('@')[0] || roomUserId,
      email: current.email,
      emailVerified: true,
      role: isAdmin && !isRoomOwner ? 'admin' : 'organizer',
      avatar: current.avatarUrl || `https://picsum.photos/seed/${roomUserId}/200/200`,
      roomJoinTicket: ticketRes.joinTicket,
    };
    loginForRoom(seminarUser);
    toast({
      title: t('seminar_login_success_title'),
      description: t('seminar_welcome_user', { name: current.name }),
    });
    return true;
  }

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    const roomId = Number(room.id);
    if (!Number.isFinite(roomId) || roomId <= 0) {
      toast({
        variant: 'destructive',
        title: t('seminar_login_failed_title'),
        description: t('seminar_login_failed_description'),
      });
      setIsLoading(false);
      return;
    }

    try {
      const existing = await getCurrentUser();
      if (existing && isAdminDashboardRole(existing.roleName)) {
        if (await enterAsDashboardStaff(existing, roomId)) {
          setIsLoading(false);
          return;
        }
      }
    } catch {
      /* not signed in to dashboard yet */
    }

    let roomSeatFailure: RoomLoginFailedError | null = null;

    try {
      const roomLogin = await loginRoomUser(roomId, values.username, values.password);
      const ud = roomLogin.userData;
      if (ud?.token && ud.userId) {
        const resolved = resolveStaticAssetUrl(ud.avatarUrl ?? null);
        const avatar =
          resolved ||
          `https://picsum.photos/seed/room-${encodeURIComponent(ud.userId)}/200/200`;
        const seminarUser: SeminarUser = {
          id: ud.userId,
          name: ud.displayName || ud.userName,
          displayName: ud.displayName || ud.userName,
          username: ud.userName,
          email: values.username.includes('@') ? values.username : `${ud.userName}@room.local`,
          emailVerified: true,
          role: 'participant',
          avatar,
          roomAccessToken: ud.token,
          roomJoinTicket: ud.joinTicket,
          isRoomSeatLogin: true,
        };
        loginForRoom(seminarUser);
        toast({
          title: t('seminar_login_success_title'),
          description: t('seminar_welcome_user', { name: seminarUser.name }),
        });
        setIsLoading(false);
        return;
      }
    } catch (e: unknown) {
      if (e instanceof RoomLoginFailedError) {
        roomSeatFailure = e;
        if (shouldAbortAfterRoomSeatFailure(e)) {
          toast({
            variant: 'destructive',
            title: t('seminar_room_login_failed_title'),
            description: mapRoomSeatLoginFailure(e),
          });
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      await siteLogin(
        {
          userNameOrEmail: values.username,
          password: values.password,
        },
        false
      );

      const current = await getCurrentUser();
      if (!current) {
        throw new Error('EMPTY_CURRENT_USER');
      }

      if (!isAdminDashboardRole(current.roleName)) {
        try {
          await authLogout();
        } catch {
          /* ignore */
        }
        toast({
          variant: 'destructive',
          title: t('seminar_access_denied_title'),
          description: t('seminar_room_use_room_credentials'),
        });
        setIsLoading(false);
        return;
      }

      if (await enterAsDashboardStaff(current, roomId)) {
        setIsLoading(false);
        return;
      }

      try {
        await authLogout();
      } catch {
        /* ignore */
      }
      toast({
        variant: 'destructive',
        title: t('seminar_access_denied_title'),
        description: t('seminar_room_use_room_credentials'),
      });
    } catch {
      if (roomSeatFailure) {
        toast({
          variant: 'destructive',
          title: t('seminar_room_login_failed_title'),
          description: mapRoomSeatLoginFailure(roomSeatFailure),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('seminar_login_failed_title'),
          description: t('seminar_login_failed_description'),
        });
      }
    }

    setIsLoading(false);
  }

  async function onGuestSubmit(values: z.infer<typeof guestSchema>) {
    setIsLoading(true);
    const roomId = Number(room.id);
    if (!Number.isFinite(roomId) || roomId <= 0) {
      toast({
        variant: 'destructive',
        title: t('seminar_room_login_failed_title'),
        description: t('seminar_room_login_generic'),
      });
      setIsLoading(false);
      return;
    }

    try {
      const guestName = `${values.firstName} ${values.lastName}`.trim();
      const ticket = await issueGuestJoinTicket(roomId, guestName);
      const guestUser: SeminarUser = {
        id: ticket.guestId,
        name: ticket.displayName,
        displayName: ticket.displayName,
        username: `guest-${ticket.guestId.slice(0, 8)}`,
        email: `guest-${ticket.guestId}@room.local`,
        emailVerified: false,
        role: 'guest',
        avatar: `https://picsum.photos/seed/${encodeURIComponent(ticket.guestId)}/200/200`,
        roomJoinTicket: ticket.joinTicket,
      };

      loginForRoom(guestUser);
      toast({
        title: t('seminar_joined_as_guest_title'),
        description: t('seminar_welcome_user', { name: guestUser.displayName }),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('seminar_room_login_failed_title'),
        description: t('seminar_guest_capacity_full'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  const guestCapacityFull = false;

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{t('seminar_join_room_title', { roomName: room.name })}</CardTitle>
          <CardDescription>{t('seminar_login_to_access')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isGuest ? (
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('seminar_username_or_email_label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('seminar_username_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login_password_label')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoaderCircle className="animate-spin" />}
                  {isLoading ? t('login_logging_in') : t('seminar_login_to_room')}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...guestForm}>
              <form
                onSubmit={guestForm.handleSubmit(onGuestSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={guestForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('seminar_first_name_label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('seminar_first_name_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={guestForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('seminar_last_name_label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('seminar_last_name_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoaderCircle className="animate-spin" />}
                  {isLoading ? t('login_logging_in') : t('seminar_join_as_guest')}
                </Button>
              </form>
            </Form>
          )}

          {room.allowGuests && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('seminar_or')}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                type="button"
                onClick={() => setIsGuest(!isGuest)}
                disabled={isLoading || (isGuest ? false : guestCapacityFull)}
              >
                {isGuest ? t('seminar_registered_user_login') : t('seminar_join_as_guest')}
              </Button>
              {guestCapacityFull && !isGuest && (
                <p className="mt-2 text-center text-xs text-destructive">
                  {t('seminar_guest_capacity_full')}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
