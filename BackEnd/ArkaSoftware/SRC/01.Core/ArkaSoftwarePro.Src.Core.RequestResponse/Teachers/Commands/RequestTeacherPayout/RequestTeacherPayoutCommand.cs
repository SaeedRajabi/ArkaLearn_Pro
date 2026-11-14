using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RequestTeacherPayout;

public class RequestTeacherPayoutCommand : ICommand<string>, IWebRequest
{
    public long AmountToman { get; set; }
    public string? Note { get; set; }
    public string Path => "/api/Service/Teacher/RequestTeacherPayout";
}
