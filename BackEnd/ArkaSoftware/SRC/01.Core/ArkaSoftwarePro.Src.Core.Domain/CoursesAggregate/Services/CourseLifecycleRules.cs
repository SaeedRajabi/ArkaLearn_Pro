using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;

public static class CourseLifecycleRules
{
    public static CourseLifecyclePhase ResolveEffectivePhase(
        CourseLifecyclePhase stored,
        DateTime? registrationDeadlineUtc,
        DateTime? courseStartUtc,
        DateTime? courseEndUtc,
        DateTime utcNow)
    {
        if (courseEndUtc.HasValue && utcNow >= courseEndUtc.Value)
            return CourseLifecyclePhase.Ended;

        if (stored == CourseLifecyclePhase.NotStarted)
        {
            if (registrationDeadlineUtc.HasValue && utcNow >= registrationDeadlineUtc.Value)
                return CourseLifecyclePhase.InProgress;

            if (courseStartUtc.HasValue && utcNow >= courseStartUtc.Value)
                return CourseLifecyclePhase.InProgress;
        }

        return stored;
    }

    public static bool CanAcceptRegistration(bool isPublish, CourseLifecyclePhase phase, bool isRegistrationClosed = false)
    {
        if (!isPublish || isRegistrationClosed)
            return false;

        return phase is CourseLifecyclePhase.NotStarted
            or CourseLifecyclePhase.InProgress
            or CourseLifecyclePhase.Ended;
    }

    public static bool CanEditLifecycleSchedule(CourseLifecyclePhase phase) =>
        phase is CourseLifecyclePhase.NotStarted or CourseLifecyclePhase.InProgress;

    public static bool CanUploadLessonVideos(CourseDeliveryMode deliveryMode, CourseLifecyclePhase phase) =>
        (deliveryMode is CourseDeliveryMode.DirectDownload
            or CourseDeliveryMode.DesktopLicense
            or CourseDeliveryMode.SpotPlayerLicense) // legacy → treated as Arka desktop
        && phase == CourseLifecyclePhase.InProgress;

    public static bool CanRetainLessonVideos(CourseDeliveryMode deliveryMode, CourseLifecyclePhase phase) =>
        (deliveryMode is CourseDeliveryMode.DirectDownload
            or CourseDeliveryMode.DesktopLicense
            or CourseDeliveryMode.SpotPlayerLicense)
        && phase is CourseLifecyclePhase.InProgress or CourseLifecyclePhase.Ended;

    public static bool AllowsWebLessonVideoPlayback(CourseDeliveryMode deliveryMode) =>
        deliveryMode == CourseDeliveryMode.DirectDownload;

        public static bool CanAccessLessonVideo(
        CourseLifecyclePhase phase,
        bool isLessonPublished,
        bool hasVideo,
        bool isEnrolled,
        bool isStaff,
        bool isVideoModerationApproved)
    {
        if (!hasVideo)
            return false;

        if (isStaff)
            return true;

        if (!isEnrolled)
            return false;

        if (!isVideoModerationApproved)
            return false;

        return phase switch
        {
            CourseLifecyclePhase.Ended => true,
            CourseLifecyclePhase.InProgress => isLessonPublished,
            _ => false,
        };
    }

    public static string ToApiValue(CourseLifecyclePhase phase) =>
        phase switch
        {
            CourseLifecyclePhase.InProgress => "inProgress",
            CourseLifecyclePhase.Ended => "ended",
            _ => "notStarted",
        };

    public static CourseLifecyclePhase Parse(string? value)
    {
        var normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
        return normalized switch
        {
            "inprogress" or "in_progress" or "ongoing" => CourseLifecyclePhase.InProgress,
            "ended" or "completed" or "finished" => CourseLifecyclePhase.Ended,
            _ => CourseLifecyclePhase.NotStarted,
        };
    }
}
