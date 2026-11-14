using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

/// <summary>Teacher satisfaction rating of a student for a course enrollment.</summary>
public class TeacherStudentSatisfaction : AggregateRoot
{
    public long CourseId { get; private set; }
    public long EnrollmentId { get; private set; }
    public long TeacherUserId { get; private set; }
    public long StudentUserId { get; private set; }
    /// <summary>1–5 score.</summary>
    public byte Score { get; private set; }
    public string? Note { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    private TeacherStudentSatisfaction() { }

    public static TeacherStudentSatisfaction Create(
        long courseId,
        long enrollmentId,
        long teacherUserId,
        long studentUserId,
        byte score,
        string? note)
    {
        var entity = new TeacherStudentSatisfaction
        {
            CourseId = courseId,
            EnrollmentId = enrollmentId,
            TeacherUserId = teacherUserId,
            StudentUserId = studentUserId,
        };
        entity.Update(score, note);
        return entity;
    }

    public void Update(byte score, string? note)
    {
        if (score is < 1 or > 5)
            throw new ArgumentOutOfRangeException(nameof(score), "Score must be between 1 and 5.");
        Score = score;
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
