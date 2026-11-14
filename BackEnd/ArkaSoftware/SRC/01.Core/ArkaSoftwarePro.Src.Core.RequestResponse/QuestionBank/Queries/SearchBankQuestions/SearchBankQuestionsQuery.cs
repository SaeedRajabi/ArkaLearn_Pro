using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.SearchBankQuestions;

public class SearchBankQuestionsQuery : PageQuery<PagedData<BankQuestionListItemQri>>, IWebRequest
{
    public string? InputValue { get; set; }
    public byte? QuestionType { get; set; }
    public byte? Difficulty { get; set; }
    public string? Category { get; set; }
    public string? Topic { get; set; }
    public long? CourseId { get; set; }
    public bool MineOnly { get; set; }
    public long ActorUserId { get; set; }
    public long? ActorTeacherId { get; set; }
    public bool IsAdmin { get; set; }
    public string Path => "/api/Service/QuestionBank/Search";
}

public class BankQuestionListItemQri
{
    public long Id { get; set; }
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Topic { get; set; }
    public string? Tags { get; set; }
    public long? CourseId { get; set; }
    public string? CourseTitle { get; set; }
    public decimal DefaultPoints { get; set; }
    public byte EffectiveDifficulty { get; set; }
    public byte? ManualDifficulty { get; set; }
    public byte ComputedDifficulty { get; set; }
    public decimal CorrectRate { get; set; }
    public int TotalGradedAnswers { get; set; }
    public int CorrectAnswers { get; set; }
    public int UsageCount { get; set; }
    public long OwnerUserId { get; set; }
    public DateTime? CreatedAt { get; set; }
}
