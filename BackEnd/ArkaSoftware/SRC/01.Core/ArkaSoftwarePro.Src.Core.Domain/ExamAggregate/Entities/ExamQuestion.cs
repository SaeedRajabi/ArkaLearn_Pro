using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;

public class ExamQuestion : Entity
{
    public long ExamId { get; private set; }
    public long? BankQuestionId { get; private set; }
    public int OrderIndex { get; private set; }
    public ExamQuestionType QuestionType { get; private set; }
    public string Prompt { get; private set; } = string.Empty;
    public string? CodeSnippet { get; private set; }
    public string? CodeLanguage { get; private set; }
    public decimal Points { get; private set; }

    public Exam? Exam { get; private set; }

    private readonly List<ExamQuestionOption> _options = new();
    public IReadOnlyList<ExamQuestionOption> Options => _options;

    private ExamQuestion() { }

    public static ExamQuestion Create(
        int orderIndex,
        ExamQuestionType questionType,
        string prompt,
        decimal points,
        IEnumerable<(string Text, bool IsCorrect)>? options = null,
        string? codeSnippet = null,
        string? codeLanguage = null,
        long? bankQuestionId = null)
    {
        if (string.IsNullOrWhiteSpace(prompt))
            throw new InvalidEntityStateException("Question prompt is required.", nameof(ExamQuestion));
        if (points <= 0)
            throw new InvalidEntityStateException("Question points must be positive.", nameof(ExamQuestion));

        var question = new ExamQuestion
        {
            OrderIndex = orderIndex,
            QuestionType = questionType,
            Prompt = prompt.Trim(),
            CodeSnippet = string.IsNullOrWhiteSpace(codeSnippet) ? null : codeSnippet.Trim(),
            CodeLanguage = string.IsNullOrWhiteSpace(codeLanguage) ? null : codeLanguage.Trim().ToLowerInvariant(),
            Points = points,
            BankQuestionId = bankQuestionId is > 0 ? bankQuestionId : null,
        };

        if (questionType is ExamQuestionType.MultipleChoice or ExamQuestionType.TrueFalse)
        {
            var optionList = (options ?? []).ToList();
            if (optionList.Count == 0)
                throw new InvalidEntityStateException("Options are required for this question type.", nameof(ExamQuestion));

            var order = 0;
            foreach (var opt in optionList)
            {
                question._options.Add(ExamQuestionOption.Create(opt.Text, opt.IsCorrect, order++));
            }
        }

        return question;
    }

    public void LinkToBankQuestion(long bankQuestionId)
    {
        if (bankQuestionId <= 0)
            throw new InvalidEntityStateException("Bank question id is invalid.", nameof(ExamQuestion));
        BankQuestionId = bankQuestionId;
    }
}
