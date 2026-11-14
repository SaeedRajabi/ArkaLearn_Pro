'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Video, Mic, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SeminarRoom } from '@/lib/types';
import { SeminarRoomComponent } from './seminar-room';
import { useLanguage } from '@/components/language-provider';

interface OrganizerDeviceSetupProps {
  room: SeminarRoom;
  userRole: 'organizer' | 'admin' | 'presenter';
}

export function OrganizerDeviceSetup({ room, userRole }: OrganizerDeviceSetupProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const isWebcamAllowed =
    userRole === 'organizer' || userRole === 'admin' || userRole === 'presenter';

  const [useWebcam, setUseWebcam] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (joined || isJoining) return;
    if (!useWebcam && !useMicrophone) {
      setHasPermission(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    let isActive = true;
    let localStream: MediaStream | null = null;

    const getPermissions = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: isWebcamAllowed && useWebcam,
          audio: useMicrophone,
        });

        if (isActive) {
          localStream = mediaStream;
          setStream(mediaStream);
          setHasPermission(true);
        } else {
          mediaStream.getTracks().forEach((track) => track.stop());
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        if (isActive) {
          setHasPermission(false);
          toast({
            variant: 'destructive',
            title: t('seminar_device_access_denied_title'),
            description: t('seminar_device_access_denied_description'),
          });
        }
      }
    };

    void getPermissions();

    return () => {
      isActive = false;
      if (localStream && !joined) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isWebcamAllowed, useWebcam, useMicrophone, joined, isJoining, toast, t]);

  useEffect(() => {
    if (stream && videoRef.current) {
      if (useWebcam && isWebcamAllowed) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, useWebcam, isWebcamAllowed]);

  const handleJoin = () => {
    setIsJoining(true);
    toast({
      title: t('seminar_joining_room_title'),
      description: t('seminar_joining_room_description', { roomName: room.name }),
    });

    setTimeout(() => {
      setJoined(true);
      setIsJoining(false);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }, 400);
  };

  if (joined) {
    return (
      <SeminarRoomComponent
        room={room}
        initialMicOn={useMicrophone}
        initialCameraOn={useWebcam}
      />
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t('seminar_join_room_title', { roomName: room.name })}</CardTitle>
          <CardDescription>
            {t('seminar_join_room_description')}
          </CardDescription>
          <p className="text-sm text-muted-foreground pt-2">
            {t('seminar_join_room_optional_av') ??
              'You can enter without camera or microphone and turn them on later inside the room.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
            {useWebcam && hasPermission && isWebcamAllowed ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                <Video className="h-16 w-16" />
                <p>{t('seminar_camera_off')}</p>
              </div>
            )}
          </div>

          {hasPermission === false && (useWebcam || useMicrophone) && (
            <p className="text-sm text-destructive">
              {t('seminar_permissions_optional_denied') ??
                'Could not access the selected devices. You can still join and enable them later from the room toolbar.'}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 rounded-md border p-4">
              <Checkbox
                id="useWebcam"
                checked={useWebcam}
                onCheckedChange={(checked) => setUseWebcam(!!checked)}
                disabled={!isWebcamAllowed}
              />
              <Label htmlFor="useWebcam" className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {t('seminar_webcam')}
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-4">
              <Checkbox
                id="useMicrophone"
                checked={useMicrophone}
                onCheckedChange={(checked) => setUseMicrophone(!!checked)}
              />
              <Label htmlFor="useMicrophone" className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                {t('seminar_microphone')}
              </Label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleJoin} disabled={isJoining}>
            {isJoining ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                {t('seminar_joining')}
              </>
            ) : (
              t('seminar_join_room_button')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
