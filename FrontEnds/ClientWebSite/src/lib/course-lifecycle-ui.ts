export type CourseLifecyclePhase = 'notStarted' | 'inProgress' | 'ended';
export type CourseDeliveryMode = 'directDownload' | 'desktopLicense';

export function canUploadLessonVideos(
  deliveryMode: CourseDeliveryMode,
  lifecyclePhase: CourseLifecyclePhase
): boolean {
  return (deliveryMode === 'directDownload' || deliveryMode === 'desktopLicense') && lifecyclePhase === 'inProgress';
}

export function canEditLifecycleSchedule(lifecyclePhase: CourseLifecyclePhase): boolean {
  return lifecyclePhase === 'notStarted' || lifecyclePhase === 'inProgress';
}

export function canToggleLessonPublish(lifecyclePhase: CourseLifecyclePhase): boolean {
  return lifecyclePhase === 'inProgress';
}

type LessonAccessInput = {
  hasVideo?: boolean;
  isPublished?: boolean;
};

/** Mirrors backend CourseLifecycleRules.CanAccessLessonVideo for enrolled students. */
export function canAccessLessonVideo(
  phase: CourseLifecyclePhase,
  lesson: LessonAccessInput,
  isEnrolled: boolean
): boolean {
  if (!lesson.hasVideo || !isEnrolled) return false;

  if (phase === 'ended') return true;
  if (phase === 'inProgress') return lesson.isPublished === true;
  return false;
}

export function lifecyclePhaseHintKey(
  deliveryMode: CourseDeliveryMode,
  lifecyclePhase: CourseLifecyclePhase
): string {
  if (deliveryMode === 'desktopLicense') return 'addCourse_lifecycle_hint_desktop_license';
  if (lifecyclePhase === 'notStarted') return 'addCourse_lifecycle_hint_not_started';
  if (lifecyclePhase === 'inProgress') return 'addCourse_lifecycle_hint_in_progress';
  return 'addCourse_lifecycle_hint_ended';
}
