using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;

public class Exam : AggregateRoot
{
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public long CourseId { get; private set; }
    public long TeacherId { get; private set; }
    public string Level { get; private set; } = "beginner";
    public DateTime EndsAtUtc { get; private set; }
    public int DurationMinutes { get; private set; }
    public ExamStatus Status { get; private set; } = ExamStatus.Published;
    public decimal TotalPoints { get; private set; }

    /// <summary>
    /// Teacher-controlled policy set at exam creation: when false (default), pasted
    /// content in answers is tracked and flagged for the teacher in grading views.
    /// </summary>
    public bool AllowPaste { get; private set; }

    private readonly List<ExamQuestion> _questions = new();
    public IReadOnlyList<ExamQuestion> Questions => _questions;

    private readonly List<ExamAssignment> _assignments = new();
    public IReadOnlyList<ExamAssignment> Assignments => _assignments;

    private Exam() { }

    public static Exam Create(
        string title,
        string? description,
        long courseId,
        long teacherId,
        string level,
        DateTime endsAtUtc,
        int durationMinutes,
        IEnumerable<ExamQuestion> questions,
        IEnumerable<ExamAssignment> assignments,
        bool allowPaste = false)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new InvalidEntityStateException("Exam title is required.", nameof(Exam));
        if (courseId <= 0)
            throw new InvalidEntityStateException("Course is required.", nameof(Exam));
        if (teacherId <= 0)
            throw new InvalidEntityStateException("Teacher is required.", nameof(Exam));
        if (durationMinutes <= 0)
            throw new InvalidEntityStateException("Duration must be positive.", nameof(Exam));

        var questionList = questions.ToList();
        if (questionList.Count == 0)
            throw new InvalidEntityStateException("At least one question is required.", nameof(Exam));

        var assignmentList = assignments.ToList();
        if (assignmentList.Count == 0)
            throw new InvalidEntityStateException("At least one student must be assigned.", nameof(Exam));

        var exam = new Exam
        {
            Title = title.Trim(),
            Description = description?.Trim(),
            CourseId = courseId,
            TeacherId = teacherId,
            Level = string.IsNullOrWhiteSpace(level) ? "beginner" : level.Trim().ToLowerInvariant(),
            EndsAtUtc = endsAtUtc,
            DurationMinutes = durationMinutes,
            Status = ExamStatus.Published,
            TotalPoints = questionList.Sum(q => q.Points),
            AllowPaste = allowPaste,
        };

        exam._questions.AddRange(questionList);
        exam._assignments.AddRange(assignmentList);
        return exam;
    }

    public void CloseIfExpired()
    {
        if (Status == ExamStatus.Published && EndsAtUtc <= DateTime.UtcNow)
            Status = ExamStatus.Closed;
    }
}
