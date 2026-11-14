using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

/// <summary>Allowlisted lesson for a Partial content-access desktop license.</summary>
public class DesktopLicenseLessonAccess : AggregateRoot
{
    public long EnrollmentId { get; private set; }
    public long LessonId { get; private set; }

    private DesktopLicenseLessonAccess() { }

    public static DesktopLicenseLessonAccess Grant(long enrollmentId, long lessonId)
    {
        if (enrollmentId <= 0) throw new ArgumentException("Enrollment id is required.", nameof(enrollmentId));
        if (lessonId <= 0) throw new ArgumentException("Lesson id is required.", nameof(lessonId));

        return new DesktopLicenseLessonAccess
        {
            EnrollmentId = enrollmentId,
            LessonId = lessonId,
        };
    }
}
