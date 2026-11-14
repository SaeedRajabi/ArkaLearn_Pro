using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Entities;

public class BankQuestionOption : Entity
{
    public long BankQuestionId { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public bool IsCorrect { get; private set; }
    public int OrderIndex { get; private set; }

    public BankQuestion? BankQuestion { get; private set; }

    private BankQuestionOption() { }

    public static BankQuestionOption Create(string text, bool isCorrect, int orderIndex)
    {
        return new BankQuestionOption
        {
            Text = text?.Trim() ?? string.Empty,
            IsCorrect = isCorrect,
            OrderIndex = orderIndex,
        };
    }
}
