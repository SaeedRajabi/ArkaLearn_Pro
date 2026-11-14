
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { cn } from '@/lib/utils';
import type { UserMediaState } from './seminar-room';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ColorPicker } from '../ui/color-picker';
import { useLanguage } from '@/components/language-provider';

export type RecordingSettings = {
  format: string;
  quality: string;
  resolution: string;
  saveLocation: 'download' | 'picker';
  liveProcessing: 'none' | 'summary' | 'subtitles' | 'both';
  /** Mix remote participant mics into the recording (default true). */
  includeParticipantAudio: boolean;
};

export type FileSharingSettings = {
  allowFileSharing: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
};

export type ImageSettings = {
    brightness: number;
    contrast: number;
    touchUp: boolean;
    backgroundEffect: 'none' | 'blur' | 'image';
    backgroundImage: string;
};

export type WebcamOverlaySettings = {
    shape: 'square' | 'circle';
    cornerRadius: number;
    borderWidth: number;
    borderColor: string;
    shadow: boolean;
    shadowColor: string;
}

export type SeminarSettings = {
    media: UserMediaState;
    recording: RecordingSettings;
    fileSharing: FileSharingSettings;
    image: ImageSettings;
    webcamOverlay: WebcamOverlaySettings;
}

type SeminarSettingsDialogProps = {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSaveAction: (settings: SeminarSettings) => void;
  initialSettings: SeminarSettings;
};

export function SeminarSettingsDialog({
  isOpen,
  onOpenChangeAction,
  onSaveAction,
  initialSettings,
}: SeminarSettingsDialogProps) {
    const { t, locale } = useLanguage();
    const isRtl = locale === 'fa';
    const onOpenChange = onOpenChangeAction;
    const onSave = onSaveAction;
    const { toast } = useToast();
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [activeTab, setActiveTab] = useState('image');
    const wasOpenRef = useRef(false);

    const [selectedCamera, setSelectedCamera] = useState<string>(initialSettings.media.videoDeviceId || '');
    const [selectedMicrophone, setSelectedMicrophone] = useState<string>(initialSettings.media.audioDeviceId || '');
    const [selectedSpeaker, setSelectedSpeaker] = useState<string>(initialSettings.media.speakerDeviceId || '');
    
    const previewStreamRef = useRef<MediaStream | null>(null);

    // Image settings
    const [brightness, setBrightness] = useState(initialSettings.image.brightness);
    const [contrast, setContrast] = useState(initialSettings.image.contrast);
    const [touchUp, setTouchUp] = useState(initialSettings.image.touchUp);
    const [backgroundEffect, setBackgroundEffect] = useState(initialSettings.image.backgroundEffect);
    const [backgroundImage, setBackgroundImage] = useState(initialSettings.image.backgroundImage);

    // Webcam Overlay settings
    const [webcamShape, setWebcamShape] = useState(initialSettings.webcamOverlay.shape);
    const [cornerRadius, setCornerRadius] = useState(initialSettings.webcamOverlay.cornerRadius);
    const [borderWidth, setBorderWidth] = useState(initialSettings.webcamOverlay.borderWidth);
    const [borderColor, setBorderColor] = useState(initialSettings.webcamOverlay.borderColor);
    const [shadow, setShadow] = useState(initialSettings.webcamOverlay.shadow);
    const [shadowColor, setShadowColor] = useState(initialSettings.webcamOverlay.shadowColor);

    // Recording settings state
    const [recordingFormat, setRecordingFormat] = useState(initialSettings.recording.format);
    const [recordingQuality, setRecordingQuality] = useState(initialSettings.recording.quality);
    const [recordingResolution, setRecordingResolution] = useState(initialSettings.recording.resolution);
    const [liveProcessing, setLiveProcessing] = useState(initialSettings.recording.liveProcessing);
    const [includeParticipantAudio, setIncludeParticipantAudio] = useState(
      initialSettings.recording.includeParticipantAudio !== false
    );

    const [echoCancellation, setEchoCancellation] = useState(
      initialSettings.media.echoCancellation !== false
    );
    const [noiseSuppression, setNoiseSuppression] = useState(
      initialSettings.media.noiseSuppression !== false
    );
    const [autoGainControl, setAutoGainControl] = useState(
      initialSettings.media.autoGainControl !== false
    );
    const [voiceIsolation, setVoiceIsolation] = useState(
      Boolean(initialSettings.media.voiceIsolation)
    );
    const [audioQuality, setAudioQuality] = useState(
      initialSettings.media.audioQuality || 'speech'
    );
    const [videoQuality, setVideoQuality] = useState(
      initialSettings.media.videoQuality || 'high'
    );

    const cameras = devices.filter(d => d.kind === 'videoinput');
    const microphones = devices.filter(d => d.kind === 'audioinput');
    const speakers = devices.filter(d => d.kind === 'audiooutput');

    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            setSelectedCamera(initialSettings.media.videoDeviceId || '');
            setSelectedMicrophone(initialSettings.media.audioDeviceId || '');
            setSelectedSpeaker(initialSettings.media.speakerDeviceId || '');
            setBrightness(initialSettings.image.brightness);
            setContrast(initialSettings.image.contrast);
            setTouchUp(initialSettings.image.touchUp);
            setBackgroundEffect(initialSettings.image.backgroundEffect);
            setBackgroundImage(initialSettings.image.backgroundImage);
            setWebcamShape(initialSettings.webcamOverlay.shape);
            setCornerRadius(initialSettings.webcamOverlay.cornerRadius);
            setBorderWidth(initialSettings.webcamOverlay.borderWidth);
            setBorderColor(initialSettings.webcamOverlay.borderColor);
            setShadow(initialSettings.webcamOverlay.shadow);
            setShadowColor(initialSettings.webcamOverlay.shadowColor);
            setRecordingFormat(initialSettings.recording.format);
            setRecordingQuality(initialSettings.recording.quality);
            setRecordingResolution(initialSettings.recording.resolution);
            setLiveProcessing(initialSettings.recording.liveProcessing);
            setIncludeParticipantAudio(initialSettings.recording.includeParticipantAudio !== false);
            setEchoCancellation(initialSettings.media.echoCancellation !== false);
            setNoiseSuppression(initialSettings.media.noiseSuppression !== false);
            setAutoGainControl(initialSettings.media.autoGainControl !== false);
            setVoiceIsolation(Boolean(initialSettings.media.voiceIsolation));
            setAudioQuality(initialSettings.media.audioQuality || 'speech');
            setVideoQuality(initialSettings.media.videoQuality || 'high');
            setActiveTab('image');
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, initialSettings]);

    useEffect(() => {
        const getDevices = async () => {
            if (!isOpen) return;
            try {
                // Ensure we have permissions before enumerating
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                const enumeratedDevices = await navigator.mediaDevices.enumerateDevices();
                setDevices(enumeratedDevices);
            } catch (err) {
                console.error('Error enumerating devices:', err);
                toast({
                    variant: 'destructive',
                    title: t('seminar_device_error_title'),
                    description: t('seminar_device_error_description'),
                });
            }
        };
        getDevices();
    }, [isOpen, t, toast]);

    useEffect(() => {
      if (devices.length > 0) {
        if (!selectedCamera && cameras.length > 0) {
          setSelectedCamera(cameras[0].deviceId);
        }
        if (!selectedMicrophone && microphones.length > 0) {
          setSelectedMicrophone(microphones[0].deviceId);
        }
        if (!selectedSpeaker && speakers.length > 0) {
          setSelectedSpeaker(speakers[0].deviceId);
        }
      }
    }, [devices, cameras, microphones, speakers, selectedCamera, selectedMicrophone, selectedSpeaker]);

    useEffect(() => {
        let isMounted = true;
        const startStream = async () => {
            if (previewStreamRef.current) {
                previewStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (!selectedCamera || !isMounted) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedCamera } },
                });
                if (isMounted) {
                    previewStreamRef.current = stream;
                    if (videoPreviewRef.current) {
                        videoPreviewRef.current.srcObject = stream;
                    }
                } else {
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (error) {
                console.error("Failed to get preview stream:", error);
            }
        };

        const stopStream = () => {
            if (previewStreamRef.current) {
                previewStreamRef.current.getTracks().forEach(track => track.stop());
                previewStreamRef.current = null;
            }
        };

        if (isOpen && (activeTab === 'image' || activeTab === 'webcam-overlay')) {
            startStream();
        } else {
            stopStream();
        }

        return () => {
            isMounted = false;
            stopStream();
        };
    }, [isOpen, activeTab, selectedCamera]);


    const handleSaveChanges = () => {
        const settings: SeminarSettings = {
            media: {
                ...initialSettings.media,
                videoDeviceId: selectedCamera,
                audioDeviceId: selectedMicrophone,
                speakerDeviceId: selectedSpeaker,
                echoCancellation,
                noiseSuppression,
                autoGainControl,
                voiceIsolation,
                audioQuality,
                videoQuality,
            },
            recording: {
                format: recordingFormat,
                quality: recordingQuality,
                resolution: recordingResolution,
                saveLocation: 'download',
                liveProcessing: liveProcessing,
                includeParticipantAudio,
            },
            fileSharing: { 
                ...initialSettings.fileSharing,
            },
            image: {
                brightness,
                contrast,
                touchUp,
                backgroundEffect,
                backgroundImage,
            },
            webcamOverlay: {
                shape: webcamShape,
                cornerRadius,
                borderWidth,
                borderColor,
                shadow,
                shadowColor,
            }
        };

        onSave(settings);

        toast({
            title: t('toast_settings_saved_title'),
            description: t('seminar_settings_saved_description'),
        });
        
        onOpenChange(false);
    };

    const filterStyle = `brightness(${brightness}%) contrast(${contrast}%)`;
    
    const previewWrapperStyle: React.CSSProperties = {
        borderRadius: webcamShape === 'circle' ? '9999px' : `${cornerRadius}px`,
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: shadow ? `0 10px 20px -5px ${shadowColor}` : 'none',
        backgroundImage: backgroundEffect === 'image' && backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    const videoPreviewStyle: React.CSSProperties = {
        filter: filterStyle,
        borderRadius: webcamShape === 'circle' ? '9999px' : `${Math.max(0, cornerRadius - borderWidth)}px`,
    };
    
    const videoWrapperClass = cn("w-full h-full object-cover", {
        'blur-sm': touchUp,
    });
    
    const videoBackdropStyle: React.CSSProperties = {
        backdropFilter: backgroundEffect === 'blur' ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: backgroundEffect === 'blur' ? 'blur(8px)' : 'none',
    };

    const titleAlignClass = isRtl
      ? '![direction:rtl] !text-right'
      : '![direction:ltr] !text-left';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'sm:max-w-2xl text-start',
            isRtl && '[&>button]:!left-4 [&>button]:!right-auto'
          )}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle className={titleAlignClass}>{t('seminar_settings_title')}</DialogTitle>
          <DialogDescription className={titleAlignClass}>
            {t('seminar_settings_description')}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="image" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="image">{t('seminar_settings_tab_image')}</TabsTrigger>
            <TabsTrigger value="webcam-overlay">{t('seminar_settings_tab_webcam_overlay')}</TabsTrigger>
            <TabsTrigger value="media">{t('seminar_settings_tab_media')}</TabsTrigger>
            <TabsTrigger value="recording">{t('seminar_settings_tab_recording')}</TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-4 space-y-6 text-start">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="camera-select">{t('seminar_camera_label')}</Label>
                        <Select value={selectedCamera} onValueChange={setSelectedCamera} disabled={cameras.length === 0}>
                            <SelectTrigger id="camera-select">
                            <SelectValue placeholder={t('seminar_select_camera')} />
                            </SelectTrigger>
                            <SelectContent>
                            {cameras.map(device => (
                              <SelectItem key={device.deviceId} value={device.deviceId}>
                                {device.label || t('seminar_camera_device', { index: cameras.indexOf(device) + 1 })}
                              </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="touch-up">{t('seminar_touch_up_appearance')}</Label>
                        </div>
                        <Switch id="touch-up" checked={touchUp} onCheckedChange={setTouchUp} />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label>{t('seminar_background_effects')}</Label>
                        <RadioGroup value={backgroundEffect} onValueChange={(val) => setBackgroundEffect(val as 'none' | 'blur' | 'image')} className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="none" id="bg-none" />
                                <Label htmlFor="bg-none">{t('seminar_none')}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="blur" id="bg-blur" />
                                <Label htmlFor="bg-blur">{t('seminar_blur')}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="image" id="bg-image" disabled />
                                <Label htmlFor="bg-image" className="text-muted-foreground">{t('seminar_image')}</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                 <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
                    {selectedCamera ? (
                        <div style={previewWrapperStyle} className="w-4/5 h-4/5 overflow-hidden relative">
                            <div className="absolute inset-0" style={videoBackdropStyle}></div>
                            <video ref={videoPreviewRef} autoPlay muted className={cn(videoWrapperClass, "relative")} style={videoPreviewStyle} />
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-center">
                            <p>{t('seminar_camera_off_or_unavailable')}</p>
                        </div>
                    )}
                 </div>
             </div>
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="brightness">{t('seminar_brightness_label', { value: brightness })}</Label>
                    <Slider id="brightness" min={50} max={150} step={1} value={[brightness]} onValueChange={(val) => setBrightness(val[0])} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="contrast">{t('seminar_contrast_label', { value: contrast })}</Label>
                    <Slider id="contrast" min={50} max={150} step={1} value={[contrast]} onValueChange={(val) => setContrast(val[0])} />
                </div>
             </div>
          </TabsContent>
          
          <TabsContent value="webcam-overlay" className="mt-4 space-y-6 text-start">
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('seminar_shape_label')}</Label>
                        <RadioGroup value={webcamShape} onValueChange={(val) => setWebcamShape(val as 'square' | 'circle')} className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="square" id="shape-square" />
                                <Label htmlFor="shape-square">{t('seminar_shape_square')}</Label>
                            </div>
                             <div className="flex items-center gap-2">
                                <RadioGroupItem value="circle" id="shape-circle" />
                                <Label htmlFor="shape-circle">{t('seminar_shape_circle')}</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {webcamShape === 'square' && (
                        <div className="space-y-2">
                            <Label htmlFor="corner-radius">{t('seminar_corner_radius_label', { value: cornerRadius })}</Label>
                            <Slider id="corner-radius" min={0} max={40} step={1} value={[cornerRadius]} onValueChange={(val) => setCornerRadius(val[0])} />
                        </div>
                    )}
                    <Separator />
                     <div className="space-y-2">
                        <Label>{t('seminar_border_label')}</Label>
                        <div className="flex items-center gap-4">
                            <ColorPicker color={borderColor} onChangeAction={setBorderColor} />
                            <div className="flex-1">
                                <Label htmlFor="border-width" className='text-xs text-muted-foreground'>{t('seminar_border_width_label', { value: borderWidth })}</Label>
                                <Slider id="border-width" min={0} max={10} step={1} value={[borderWidth]} onValueChange={(val) => setBorderWidth(val[0])} />
                            </div>
                        </div>
                    </div>
                    <Separator />
                     <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>{t('seminar_shadow_label')}</Label>
                            <Switch checked={shadow} onCheckedChange={setShadow} />
                        </div>
                        {shadow && (
                             <div className="flex items-center gap-4">
                                <ColorPicker color={shadowColor} onChangeAction={setShadowColor} />
                                <span className='text-sm text-muted-foreground'>{t('seminar_shadow_color')}</span>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
                     {selectedCamera ? (
                        <div style={previewWrapperStyle} className="w-4/5 h-4/5 overflow-hidden relative">
                           <div className="absolute inset-0" style={videoBackdropStyle}></div>
                           <video ref={videoPreviewRef} autoPlay muted className={cn(videoWrapperClass, "relative")} style={videoPreviewStyle} />
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-center">
                            <p>{t('seminar_camera_off_or_unavailable')}</p>
                        </div>
                    )}
                 </div>
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-4 space-y-6 text-start">
            <div className="space-y-2">
              <Label htmlFor="mic-select">{t('seminar_microphone')}</Label>
              <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone} disabled={microphones.length === 0}>
                <SelectTrigger id="mic-select">
                  <SelectValue placeholder={t('seminar_select_microphone')} />
                </SelectTrigger>
                <SelectContent>
                   {microphones.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || t('seminar_microphone_device', { index: microphones.indexOf(device) + 1 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speaker-select">{t('seminar_speaker')}</Label>
              <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker} disabled={speakers.length === 0}>
                <SelectTrigger id="speaker-select">
                  <SelectValue placeholder={t('seminar_select_speaker')} />
                </SelectTrigger>
                <SelectContent>
                  {speakers.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || t('seminar_speaker_device', { index: speakers.indexOf(device) + 1 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label className="text-base">{t('seminar_audio_processing_title')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('seminar_audio_processing_desc')}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="noise-suppression">{t('seminar_noise_suppression')}</Label>
                <Switch id="noise-suppression" checked={noiseSuppression} onCheckedChange={setNoiseSuppression} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="echo-cancellation">{t('seminar_echo_cancellation')}</Label>
                <Switch id="echo-cancellation" checked={echoCancellation} onCheckedChange={setEchoCancellation} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="auto-gain">{t('seminar_auto_gain')}</Label>
                <Switch id="auto-gain" checked={autoGainControl} onCheckedChange={setAutoGainControl} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="voice-isolation">{t('seminar_voice_isolation')}</Label>
                  <p className="text-xs text-muted-foreground">{t('seminar_voice_isolation_hint')}</p>
                </div>
                <Switch id="voice-isolation" checked={voiceIsolation} onCheckedChange={setVoiceIsolation} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio-quality">{t('seminar_live_audio_quality')}</Label>
              <Select value={audioQuality} onValueChange={(v) => setAudioQuality(v as typeof audioQuality)}>
                <SelectTrigger id="audio-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speech">{t('seminar_audio_quality_speech')}</SelectItem>
                  <SelectItem value="music">{t('seminar_audio_quality_music')}</SelectItem>
                  <SelectItem value="studio">{t('seminar_audio_quality_studio')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-quality">{t('seminar_live_video_quality')}</Label>
              <Select value={videoQuality} onValueChange={(v) => setVideoQuality(v as typeof videoQuality)}>
                <SelectTrigger id="video-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t('seminar_quality_high')} (720p)</SelectItem>
                  <SelectItem value="medium">{t('seminar_quality_medium')} (540p)</SelectItem>
                  <SelectItem value="low">{t('seminar_quality_low')} (360p)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          <TabsContent value="recording" className="mt-4 space-y-6 text-start">
            <div className="space-y-2">
              <Label htmlFor="format-select">{t('seminar_recording_format')}</Label>
              <Select value={recordingFormat} onValueChange={setRecordingFormat}>
                <SelectTrigger id="format-select">
                  <SelectValue placeholder={t('seminar_select_recording_format')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video/webm;codecs=vp9">{t('seminar_recording_format_webm')}</SelectItem>
                  <SelectItem value="video/mp4">{t('seminar_recording_format_mp4')}</SelectItem>
                  <SelectItem value="audio/wav">{t('seminar_recording_format_wav')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality-select">{t('seminar_recording_quality')}</Label>
              <Select value={recordingQuality} onValueChange={setRecordingQuality}>
                <SelectTrigger id="quality-select">
                  <SelectValue placeholder={t('seminar_select_video_quality')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t('seminar_quality_high')}</SelectItem>
                  <SelectItem value="medium">{t('seminar_quality_medium')}</SelectItem>
                  <SelectItem value="low">{t('seminar_quality_low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution-select">{t('seminar_video_resolution')}</Label>
              <Select value={recordingResolution} onValueChange={setRecordingResolution}>
                <SelectTrigger id="resolution-select">
                    <SelectValue placeholder={t('seminar_select_video_resolution')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1080p">{t('seminar_resolution_1080')}</SelectItem>
                    <SelectItem value="720p">{t('seminar_resolution_720')}</SelectItem>
                    <SelectItem value="480p">{t('seminar_resolution_480')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <Label htmlFor="include-participant-audio">{t('seminar_include_participant_audio')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('seminar_include_participant_audio_desc')}
                </p>
              </div>
              <Switch
                id="include-participant-audio"
                checked={includeParticipantAudio}
                onCheckedChange={setIncludeParticipantAudio}
              />
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('actions_cancel')}</Button>
          <Button onClick={handleSaveChanges}>{t('save_changes')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
