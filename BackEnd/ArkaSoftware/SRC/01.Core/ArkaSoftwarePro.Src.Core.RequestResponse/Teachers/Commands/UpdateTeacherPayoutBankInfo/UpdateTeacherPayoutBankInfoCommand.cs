using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UpdateTeacherPayoutBankInfo;

public class UpdateTeacherPayoutBankInfoCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public string? PayoutSheba { get; set; }
    public string? PayoutCardNumber { get; set; }
    public string Path => "/api/Service/Teacher/UpdatePayoutBankInfo";
}
