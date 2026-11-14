using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.DeleteBankQuestion;

public class DeleteBankQuestion : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public long ActorUserId { get; set; }
    public bool IsAdmin { get; set; }
    public string Path => "/api/Service/QuestionBank/Delete";
}
