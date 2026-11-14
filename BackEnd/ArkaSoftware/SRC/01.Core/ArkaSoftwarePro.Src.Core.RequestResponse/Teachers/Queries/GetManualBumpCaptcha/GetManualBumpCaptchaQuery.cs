using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetManualBumpCaptcha;

public class GetManualBumpCaptchaQuery : IQuery<ManualBumpCaptchaQri>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetManualBumpCaptcha";
}

public class ManualBumpCaptchaQri
{
    public string CaptchaId { get; set; } = string.Empty;
    public string DisplayCode { get; set; } = string.Empty;
}
