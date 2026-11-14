using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.ClassifyBankQuestion;

public class ClassifyBankQuestion : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public string? Category { get; set; }
    public string? Topic { get; set; }
    public string? Tags { get; set; }
    public byte? ManualDifficulty { get; set; }
    public bool ClearManualDifficulty { get; set; }
    public long ActorUserId { get; set; }
    public bool IsAdmin { get; set; }
    public string Path => "/api/Service/QuestionBank/Classify";
}
