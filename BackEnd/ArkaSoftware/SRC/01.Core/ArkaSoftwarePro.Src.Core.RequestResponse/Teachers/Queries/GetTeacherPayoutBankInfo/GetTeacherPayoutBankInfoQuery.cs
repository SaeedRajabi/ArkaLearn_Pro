using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPayoutBankInfo;

public class GetTeacherPayoutBankInfoQuery : IQuery<TeacherPayoutBankInfoQri>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetPayoutBankInfo";
}

public class TeacherPayoutBankInfoQri
{
    public string? PayoutSheba { get; set; }
    public string? PayoutCardNumber { get; set; }
    public bool HasCompleteBankInfo { get; set; }
}
