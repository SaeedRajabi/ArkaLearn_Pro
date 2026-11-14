using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RedeemXpFreeMonth;

public class RedeemXpFreeMonthCommand : ICommand<string>, IWebRequest
{
    public string Path => "/api/Service/Teacher/RedeemXpFreeMonth";
}
