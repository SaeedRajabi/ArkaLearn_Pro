using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;

public class ExamAnswer : Entity
{
    public long ExamAttemptId { get; private set; }
    public long ExamQuestionId { get; private set; }
    public string? SelectedOptionIdsJson { get; private set; }
    public string? TextAnswer { get; private set; }
    public decimal? PointsAwarded { get; private set; }
    public bool? IsAutoGraded { get; private set; }

    /// <summary>Number of paste events the client recorded while writing this answer (0 when paste is allowed or unused).</summary>
    public int PasteCount { get; private set; }

    public ExamAttempt? ExamAttempt { get; private set; }

    private ExamAnswer() { }

    public static ExamAnswer Create(long examQuestionId)
    {
        return new ExamAnswer { ExamQuestionId = examQuestionId };
    }

    public void UpdateResponse(string? selectedOptionIdsJson, string? textAnswer, int pasteCount)
    {
        SelectedOptionIdsJson = selectedOptionIdsJson;
        TextAnswer = textAnswer;
        PasteCount = pasteCount < 0 ? 0 : pasteCount;
    }

    public void SetGrade(decimal pointsAwarded, bool isAutoGraded)
    {
        PointsAwarded = pointsAwarded;
        IsAutoGraded = isAutoGraded;
    }
}
