using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;

public class ExamQuestionOption : Entity
{
    public long ExamQuestionId { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public bool IsCorrect { get; private set; }
    public int OrderIndex { get; private set; }

    public ExamQuestion? ExamQuestion { get; private set; }

    private ExamQuestionOption() { }

    public static ExamQuestionOption Create(string text, bool isCorrect, int orderIndex)
    {
        return new ExamQuestionOption
        {
            Text = text?.Trim() ?? string.Empty,
            IsCorrect = isCorrect,
            OrderIndex = orderIndex,
        };
    }
}
