using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPlatformPayoutBankSettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetPlatformPayoutBankSettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceCommandRepository financeCommandRepository)
    : QueryHandler<GetPlatformPayoutBankSettingsQuery, PlatformPayoutBankSettingsQri>(outer)
{
    public override async Task<QueryResult<PlatformPayoutBankSettingsQri>> Handle(GetPlatformPayoutBankSettingsQuery query)
    {
        var settings = await financeCommandRepository.GetOrCreateSettingsAsync();
        return await ResultAsync(new PlatformPayoutBankSettingsQri
        {
            PlatformPayoutSheba = settings.PlatformPayoutSheba,
            PlatformPayoutCardNumber = settings.PlatformPayoutCardNumber,
            ZarinPalPlatformBankAccountId = settings.ZarinPalPlatformBankAccountId,
            IsConfigured = settings.IsPayoutGatewayConfigured(),
        });
    }
}
