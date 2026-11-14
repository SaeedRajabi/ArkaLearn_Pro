using System.Security.Cryptography;
using System.Text;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Entities;

public class BankQuestion : AggregateRoot
{
    public const int MinAttemptsForComputedDifficulty = 3;

    public ExamQuestionType QuestionType { get; private set; }
    public string Prompt { get; private set; } = string.Empty;
    public string? CodeSnippet { get; private set; }
    public string? CodeLanguage { get; private set; }
    public decimal DefaultPoints { get; private set; }
    public string? Category { get; private set; }
    public string? Topic { get; private set; }
    public string? Tags { get; private set; }
    public long? CourseId { get; private set; }
    public long OwnerUserId { get; private set; }
    public long? OwnerTeacherId { get; private set; }
    public string ContentHash { get; private set; } = string.Empty;
    public QuestionDifficulty? ManualDifficulty { get; private set; }
    public QuestionDifficulty ComputedDifficulty { get; private set; } = QuestionDifficulty.Unknown;
    public int TotalGradedAnswers { get; private set; }
    public int CorrectAnswers { get; private set; }
    public decimal CorrectRate { get; private set; }
    public int UsageCount { get; private set; }
    public bool IsActive { get; private set; } = true;

    private readonly List<BankQuestionOption> _options = new();
    public IReadOnlyList<BankQuestionOption> Options => _options;

    public QuestionDifficulty EffectiveDifficulty => ManualDifficulty ?? ComputedDifficulty;

    private BankQuestion() { }

    public static BankQuestion Create(
        ExamQuestionType questionType,
        string prompt,
        decimal defaultPoints,
        long ownerUserId,
        long? ownerTeacherId,
        IEnumerable<(string Text, bool IsCorrect)>? options = null,
        string? codeSnippet = null,
        string? codeLanguage = null,
        string? category = null,
        string? topic = null,
        string? tags = null,
        long? courseId = null,
        QuestionDifficulty? manualDifficulty = null)
    {
        if (string.IsNullOrWhiteSpace(prompt))
            throw new InvalidEntityStateException("Question prompt is required.", nameof(BankQuestion));
        if (defaultPoints <= 0)
            throw new InvalidEntityStateException("Default points must be positive.", nameof(BankQuestion));
        if (ownerUserId <= 0)
            throw new InvalidEntityStateException("Owner is required.", nameof(BankQuestion));

        var optionList = (options ?? []).ToList();
        if (questionType is ExamQuestionType.MultipleChoice or ExamQuestionType.TrueFalse && optionList.Count == 0)
            throw new InvalidEntityStateException("Options are required for this question type.", nameof(BankQuestion));

        var bank = new BankQuestion
        {
            QuestionType = questionType,
            Prompt = prompt.Trim(),
            CodeSnippet = string.IsNullOrWhiteSpace(codeSnippet) ? null : codeSnippet.Trim(),
            CodeLanguage = string.IsNullOrWhiteSpace(codeLanguage) ? null : codeLanguage.Trim().ToLowerInvariant(),
            DefaultPoints = defaultPoints,
            Category = NormalizeOptional(category),
            Topic = NormalizeOptional(topic),
            Tags = NormalizeOptional(tags),
            CourseId = courseId is > 0 ? courseId : null,
            OwnerUserId = ownerUserId,
            OwnerTeacherId = ownerTeacherId is > 0 ? ownerTeacherId : null,
            ManualDifficulty = manualDifficulty,
            ComputedDifficulty = QuestionDifficulty.Unknown,
            IsActive = true,
        };

        var order = 0;
        foreach (var opt in optionList)
            bank._options.Add(BankQuestionOption.Create(opt.Text, opt.IsCorrect, order++));

        bank.ContentHash = ComputeContentHash(bank.QuestionType, bank.Prompt, bank.CodeSnippet, bank._options);
        return bank;
    }

    public void Update(
        string prompt,
        decimal defaultPoints,
        IEnumerable<(string Text, bool IsCorrect)>? options = null,
        string? codeSnippet = null,
        string? codeLanguage = null,
        string? category = null,
        string? topic = null,
        string? tags = null,
        long? courseId = null,
        QuestionDifficulty? manualDifficulty = null)
    {
        if (string.IsNullOrWhiteSpace(prompt))
            throw new InvalidEntityStateException("Question prompt is required.", nameof(BankQuestion));
        if (defaultPoints <= 0)
            throw new InvalidEntityStateException("Default points must be positive.", nameof(BankQuestion));

        Prompt = prompt.Trim();
        DefaultPoints = defaultPoints;
        CodeSnippet = string.IsNullOrWhiteSpace(codeSnippet) ? null : codeSnippet.Trim();
        CodeLanguage = string.IsNullOrWhiteSpace(codeLanguage) ? null : codeLanguage.Trim().ToLowerInvariant();
        Category = NormalizeOptional(category);
        Topic = NormalizeOptional(topic);
        Tags = NormalizeOptional(tags);
        CourseId = courseId is > 0 ? courseId : null;
        ManualDifficulty = manualDifficulty;

        if (QuestionType is ExamQuestionType.MultipleChoice or ExamQuestionType.TrueFalse)
        {
            var optionList = (options ?? []).ToList();
            if (optionList.Count == 0)
                throw new InvalidEntityStateException("Options are required for this question type.", nameof(BankQuestion));

            _options.Clear();
            var order = 0;
            foreach (var opt in optionList)
                _options.Add(BankQuestionOption.Create(opt.Text, opt.IsCorrect, order++));
        }
        else
        {
            _options.Clear();
        }

        ContentHash = ComputeContentHash(QuestionType, Prompt, CodeSnippet, _options);
    }

    public void Classify(string? category, string? topic, string? tags, QuestionDifficulty? manualDifficulty)
    {
        Category = NormalizeOptional(category);
        Topic = NormalizeOptional(topic);
        Tags = NormalizeOptional(tags);
        ManualDifficulty = manualDifficulty;
    }

    public void Deactivate() => IsActive = false;

    public void IncrementUsage() => UsageCount++;

    public void RecordGradedAnswer(bool wasCorrect)
    {
        TotalGradedAnswers++;
        if (wasCorrect)
            CorrectAnswers++;

        CorrectRate = TotalGradedAnswers <= 0
            ? 0m
            : Math.Round((decimal)CorrectAnswers / TotalGradedAnswers, 4);

        RecomputeDifficulty();
    }

    public void RecomputeDifficulty()
    {
        if (TotalGradedAnswers < MinAttemptsForComputedDifficulty)
        {
            ComputedDifficulty = QuestionDifficulty.Unknown;
            return;
        }

        ComputedDifficulty = CorrectRate switch
        {
            >= 0.70m => QuestionDifficulty.Easy,
            >= 0.40m => QuestionDifficulty.Medium,
            _ => QuestionDifficulty.Hard,
        };
    }

    public static string ComputeContentHash(
        ExamQuestionType questionType,
        string prompt,
        string? codeSnippet,
        IEnumerable<BankQuestionOption> options)
    {
        var sb = new StringBuilder();
        sb.Append((byte)questionType).Append('|');
        sb.Append(prompt.Trim().ToLowerInvariant()).Append('|');
        sb.Append((codeSnippet ?? string.Empty).Trim().ToLowerInvariant()).Append('|');
        foreach (var opt in options.OrderBy(o => o.OrderIndex))
        {
            sb.Append(opt.Text.Trim().ToLowerInvariant())
              .Append(':')
              .Append(opt.IsCorrect ? '1' : '0')
              .Append(';');
        }

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(sb.ToString()));
        return Convert.ToHexString(bytes);
    }

    public static string ComputeContentHashFromDraft(
        ExamQuestionType questionType,
        string prompt,
        string? codeSnippet,
        IEnumerable<(string Text, bool IsCorrect)> options)
    {
        var temp = options.Select((o, i) => BankQuestionOption.Create(o.Text, o.IsCorrect, i)).ToList();
        return ComputeContentHash(questionType, prompt, codeSnippet, temp);
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
