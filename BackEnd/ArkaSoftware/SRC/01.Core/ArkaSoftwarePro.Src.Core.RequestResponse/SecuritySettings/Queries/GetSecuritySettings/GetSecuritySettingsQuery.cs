using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SecuritySettings.Queries.GetSecuritySettings;

public class GetSecuritySettingsQuery : IQuery<SecuritySettingsQri>, IWebRequest
{
    public string Path => "/api/Service/SecuritySettings/Get";
}

public class SecuritySettingsQri
{
    public int MaxLoginAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
    public int PermanentBlockAfterLockouts { get; set; } = 2;
    public int IpUnblockOtpExpiryMinutes { get; set; } = 10;
    public int IpUnblockOtpResendCooldownSeconds { get; set; } = 120;
}
