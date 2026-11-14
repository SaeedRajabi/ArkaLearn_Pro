using ArkaSoftwarePro.Src.Core.Contracts.EmailSettings.EmailSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailSettings.Queries.GetEmailSettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using RepoEmailSettingsQri = ArkaSoftwarePro.Src.Core.Contracts.EmailSettings.EmailSettingsRepositoryContracts.Queries.EmailSettingsQri;
using ResponseEmailSettingsQri = ArkaSoftwarePro.Src.Core.RequestResponse.EmailSettings.Queries.GetEmailSettings.EmailSettingsQri;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailSettingsServices.Queries;

public class GetEmailSettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailSettingsQueryRepository repository)
    : QueryHandler<GetEmailSettingsQuery, ResponseEmailSettingsQri>(outer)
{
    public override async Task<QueryResult<ResponseEmailSettingsQri>> Handle(GetEmailSettingsQuery query)
    {
        RepoEmailSettingsQri? row = await repository.GetCurrentAsync();
        if (row is null)
            return await ResultAsync(new ResponseEmailSettingsQri(), ApplicationServiceStatus.Ok);

        return await ResultAsync(new ResponseEmailSettingsQri
        {
            IsEnabled = row.IsEnabled,
            Host = row.Host,
            Port = row.Port,
            UseSsl = row.UseSsl,
            UseStartTls = row.UseStartTls,
            AllowInvalidCertificate = row.AllowInvalidCertificate,
            Username = row.Username,
            HasPassword = row.HasPassword,
            FromEmail = row.FromEmail,
            FromName = row.FromName,
            TimeoutSeconds = row.TimeoutSeconds,
            RequireEmailVerification = row.RequireEmailVerification,
            OtpExpiryMinutes = row.OtpExpiryMinutes,
            OtpResendCooldownSeconds = row.OtpResendCooldownSeconds,
            PasswordResetLinkExpiryMinutes = row.PasswordResetLinkExpiryMinutes,
            PasswordChangeUseSms = row.PasswordChangeUseSms,
            Configured = row.IsEnabled
                && !string.IsNullOrWhiteSpace(row.Host)
                && row.Port > 0
                && !string.IsNullOrWhiteSpace(row.Username)
                && row.HasPassword
                && !string.IsNullOrWhiteSpace(row.FromEmail)
        }, ApplicationServiceStatus.Ok);
    }
}
