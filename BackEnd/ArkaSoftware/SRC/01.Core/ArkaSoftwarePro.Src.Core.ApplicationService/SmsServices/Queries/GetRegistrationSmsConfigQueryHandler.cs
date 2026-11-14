using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Queries.GetRegistrationSmsConfig;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices.Queries;

public class GetRegistrationSmsConfigQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsProvider settingsProvider)
    : QueryHandler<GetRegistrationSmsConfigQuery, RegistrationSmsConfigQri>(outer)
{
    public override async Task<QueryResult<RegistrationSmsConfigQri>> Handle(GetRegistrationSmsConfigQuery query)
    {
        var settings = await settingsProvider.GetCurrentAsync();
        return await ResultAsync(new RegistrationSmsConfigQri
        {
            RegistrationOtpEnabled = settings is { RegistrationOtpEnabled: true, CanSendSms: true },
            ResendCooldownSeconds = settings?.OtpResendCooldownSeconds ?? 120,
            OtpExpiryMinutes = settings?.OtpExpiryMinutes ?? 10
        }, ApplicationServiceStatus.Ok);
    }
}
