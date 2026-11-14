using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;

public class ExamAttempt : AggregateRoot
{
    public long ExamId { get; private set; }
    public long StudentId { get; private set; }
    public long UserId { get; private set; }
    public ExamAttemptStatus Status { get; private set; } = ExamAttemptStatus.Pending;
    public DateTime? StartedAtUtc { get; private set; }
    public DateTime? ExpiresAtUtc { get; private set; }
    public DateTime? SubmittedAtUtc { get; private set; }
    public decimal? AutoScore { get; private set; }
    public decimal? FinalScore { get; private set; }
    public string? ProfessorFeedback { get; private set; }
    public DateTime? GradedAtUtc { get; private set; }

    private readonly List<ExamAnswer> _answers = new();
    public IReadOnlyList<ExamAnswer> Answers => _answers;

    private ExamAttempt() { }

    public static ExamAttempt CreatePending(long examId, long studentId, long userId, IEnumerable<long> questionIds)
    {
        var attempt = new ExamAttempt
        {
            ExamId = examId,
            StudentId = studentId,
            UserId = userId,
            Status = ExamAttemptStatus.Pending,
        };

        foreach (var questionId in questionIds)
            attempt._answers.Add(ExamAnswer.Create(questionId));

        return attempt;
    }

    public void Start(int durationMinutes, DateTime endsAtUtc)
    {
        if (Status is not ExamAttemptStatus.Pending)
            throw new InvalidEntityStateException("Exam attempt already started.", nameof(ExamAttempt));
        if (endsAtUtc <= DateTime.UtcNow)
            throw new InvalidEntityStateException("Exam deadline has passed.", nameof(ExamAttempt));

        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(durationMinutes);
        if (expires > endsAtUtc)
            expires = endsAtUtc;

        StartedAtUtc = now;
        ExpiresAtUtc = expires;
        Status = ExamAttemptStatus.InProgress;
    }

    public void SaveAnswers(IEnumerable<(long QuestionId, string? OptionIdsJson, string? TextAnswer, int PasteCount)> responses)
    {
        if (Status != ExamAttemptStatus.InProgress)
            throw new InvalidEntityStateException("Attempt is not in progress.", nameof(ExamAttempt));

        foreach (var response in responses)
        {
            var answer = _answers.FirstOrDefault(a => a.ExamQuestionId == response.QuestionId);
            answer?.UpdateResponse(response.OptionIdsJson, response.TextAnswer, response.PasteCount);
        }
    }

    public void Submit()
    {
        if (Status is not (ExamAttemptStatus.InProgress or ExamAttemptStatus.Pending))
            throw new InvalidEntityStateException("Attempt cannot be submitted.", nameof(ExamAttempt));

        Status = ExamAttemptStatus.Submitted;
        SubmittedAtUtc = DateTime.UtcNow;
    }

    public void Abandon()
    {
        if (Status is ExamAttemptStatus.Submitted or ExamAttemptStatus.Graded or ExamAttemptStatus.Abandoned)
            return;

        Status = ExamAttemptStatus.Abandoned;
        SubmittedAtUtc = DateTime.UtcNow;
    }

    public void ApplyAutoScore(decimal score)
    {
        AutoScore = score;
    }

    public void Grade(decimal finalScore, string? feedback)
    {
        if (Status is not (ExamAttemptStatus.Submitted or ExamAttemptStatus.Abandoned))
            throw new InvalidEntityStateException("Only submitted or abandoned attempts can be graded.", nameof(ExamAttempt));

        FinalScore = finalScore;
        ProfessorFeedback = feedback?.Trim();
        GradedAtUtc = DateTime.UtcNow;
        Status = ExamAttemptStatus.Graded;
    }

    public void SetAnswerGrade(long questionId, decimal points, bool isAutoGraded)
    {
        var answer = _answers.FirstOrDefault(a => a.ExamQuestionId == questionId);
        answer?.SetGrade(points, isAutoGraded);
    }

    public bool IsLocked => Status is ExamAttemptStatus.Submitted or ExamAttemptStatus.Abandoned or ExamAttemptStatus.Graded;
}
