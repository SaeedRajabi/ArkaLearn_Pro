using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.CreateBankQuestion;

public class CreateBankQuestion : ICommand<string>, IWebRequest
{
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? CodeLanguage { get; set; }
    public decimal DefaultPoints { get; set; } = 1;
    public string? Category { get; set; }
    public string? Topic { get; set; }
    public string? Tags { get; set; }
    public long? CourseId { get; set; }
    public byte? ManualDifficulty { get; set; }
    public List<BankQuestionOptionDto> Options { get; set; } = [];
    public long OwnerUserId { get; set; }
    public bool IsAdmin { get; set; }
    public string Path => "/api/Service/QuestionBank/Create";
}

public class BankQuestionOptionDto
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}
