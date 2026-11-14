using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionById;

public class GetBankQuestionByIdQuery : IQuery<BankQuestionDetailQri>, IWebRequest
{
    public long Id { get; set; }
    public long ActorUserId { get; set; }
    public bool IsAdmin { get; set; }
    public bool IncludeCorrectAnswers { get; set; } = true;
    public string Path => "/api/Service/QuestionBank/GetById";
}

public class BankQuestionDetailQri
{
    public long Id { get; set; }
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? CodeLanguage { get; set; }
    public decimal DefaultPoints { get; set; }
    public string? Category { get; set; }
    public string? Topic { get; set; }
    public string? Tags { get; set; }
    public long? CourseId { get; set; }
    public string? CourseTitle { get; set; }
    public byte EffectiveDifficulty { get; set; }
    public byte? ManualDifficulty { get; set; }
    public byte ComputedDifficulty { get; set; }
    public decimal CorrectRate { get; set; }
    public int TotalGradedAnswers { get; set; }
    public int CorrectAnswers { get; set; }
    public int UsageCount { get; set; }
    public long OwnerUserId { get; set; }
    public long? OwnerTeacherId { get; set; }
    public DateTime? CreatedAt { get; set; }
    public List<BankQuestionOptionQri> Options { get; set; } = [];
}

public class BankQuestionOptionQri
{
    public long Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}
