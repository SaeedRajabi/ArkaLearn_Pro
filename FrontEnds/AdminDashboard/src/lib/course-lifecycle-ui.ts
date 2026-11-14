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

export function lifecyclePhaseHintKey(
  deliveryMode: CourseDeliveryMode,
  lifecyclePhase: CourseLifecyclePhase
): string {
  if (deliveryMode === 'desktopLicense') return 'addCourse_lifecycle_hint_desktop_license';
  if (lifecyclePhase === 'notStarted') return 'addCourse_lifecycle_hint_not_started';
  if (lifecyclePhase === 'inProgress') return 'addCourse_lifecycle_hint_in_progress';
  return 'addCourse_lifecycle_hint_ended';
}
