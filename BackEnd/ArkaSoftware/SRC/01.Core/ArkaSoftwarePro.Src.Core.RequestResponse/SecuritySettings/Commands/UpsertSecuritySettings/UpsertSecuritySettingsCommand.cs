using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SecuritySettings.Commands.UpsertSecuritySettings;

public class UpsertSecuritySettingsCommand : ICommand<string>, IWebRequest
{
    public int MaxLoginAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
    public int PermanentBlockAfterLockouts { get; set; } = 2;
    public int IpUnblockOtpExpiryMinutes { get; set; } = 10;
    public int IpUnblockOtpResendCooldownSeconds { get; set; } = 120;
    public string Path => "/api/Service/SecuritySettings/Upsert";
}
