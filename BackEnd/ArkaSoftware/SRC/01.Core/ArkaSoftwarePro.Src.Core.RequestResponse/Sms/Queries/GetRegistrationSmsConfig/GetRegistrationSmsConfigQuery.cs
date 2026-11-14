using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Queries.GetRegistrationSmsConfig;

public class GetRegistrationSmsConfigQuery : IQuery<RegistrationSmsConfigQri>, IWebRequest
{
    public string Path => "/api/Service/Sms/Registration/Config";
}

public class RegistrationSmsConfigQri
{
    public bool RegistrationOtpEnabled { get; set; }
    public int ResendCooldownSeconds { get; set; }
    public int OtpExpiryMinutes { get; set; }
}
