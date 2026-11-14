using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings.SecuritySettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SecuritySettings.Queries.GetSecuritySettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using RepoSecuritySettingsQri = ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings.SecuritySettingsRepositoryContracts.Queries.SecuritySettingsQri;
using ResponseSecuritySettingsQri = ArkaSoftwarePro.Src.Core.RequestResponse.SecuritySettings.Queries.GetSecuritySettings.SecuritySettingsQri;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SecuritySettingsServices.Queries;

public class GetSecuritySettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISecuritySettingsQueryRepository repository)
    : QueryHandler<GetSecuritySettingsQuery, ResponseSecuritySettingsQri>(outer)
{
    public override async Task<QueryResult<ResponseSecuritySettingsQri>> Handle(GetSecuritySettingsQuery query)
    {
        RepoSecuritySettingsQri? row = await repository.GetCurrentAsync();
        if (row is null)
            return await ResultAsync(new ResponseSecuritySettingsQri(), ApplicationServiceStatus.Ok);

        return await ResultAsync(new ResponseSecuritySettingsQri
        {
            MaxLoginAttempts = row.MaxLoginAttempts,
            LockoutMinutes = row.LockoutMinutes,
            PermanentBlockAfterLockouts = row.PermanentBlockAfterLockouts,
            IpUnblockOtpExpiryMinutes = row.IpUnblockOtpExpiryMinutes,
            IpUnblockOtpResendCooldownSeconds = row.IpUnblockOtpResendCooldownSeconds,
        }, ApplicationServiceStatus.Ok);
    }
}
