using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionAnalytics;

public class GetBankQuestionAnalyticsQuery : IQuery<BankQuestionAnalyticsQri>, IWebRequest
{
    public long ActorUserId { get; set; }
    public long? ActorTeacherId { get; set; }
    public bool IsAdmin { get; set; }
    public string Path => "/api/Service/QuestionBank/Analytics";
}

public class GetBankQuestionDetailAnalyticsQuery : IQuery<BankQuestionDetailAnalyticsQri>, IWebRequest
{
    public long Id { get; set; }
    public long ActorUserId { get; set; }
    public bool IsAdmin { get; set; }
    public string Path => "/api/Service/QuestionBank/QuestionAnalytics";
}

public class BankQuestionAnalyticsQri
{
    public int TotalQuestions { get; set; }
    public int EasyCount { get; set; }
    public int MediumCount { get; set; }
    public int HardCount { get; set; }
    public int UnknownCount { get; set; }
    public int MultipleChoiceCount { get; set; }
    public int TrueFalseCount { get; set; }
    public int ShortAnswerCount { get; set; }
    public int TotalUsages { get; set; }
    public int TotalGradedAnswers { get; set; }
    public decimal AverageCorrectRate { get; set; }
    public List<BankCategoryStatQri> TopCategories { get; set; } = [];
    public List<BankQuestionListHotQri> HardestQuestions { get; set; } = [];
    public List<BankQuestionListHotQri> EasiestQuestions { get; set; } = [];
}

public class BankCategoryStatQri
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class BankQuestionListHotQri
{
    public long Id { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public byte EffectiveDifficulty { get; set; }
    public decimal CorrectRate { get; set; }
    public int TotalGradedAnswers { get; set; }
}

public class BankQuestionDetailAnalyticsQri
{
    public long Id { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public byte EffectiveDifficulty { get; set; }
    public byte? ManualDifficulty { get; set; }
    public byte ComputedDifficulty { get; set; }
    public decimal CorrectRate { get; set; }
    public int TotalGradedAnswers { get; set; }
    public int CorrectAnswers { get; set; }
    public int IncorrectAnswers { get; set; }
    public int UsageCount { get; set; }
    public int LinkedExamCount { get; set; }
    public List<BankQuestionExamUsageQri> RecentExams { get; set; } = [];
}

public class BankQuestionExamUsageQri
{
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public DateTime? CreatedAt { get; set; }
}
