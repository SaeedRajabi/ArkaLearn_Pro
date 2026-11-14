using ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Queries.GetMyStudentSupportStatus;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Queries.GetSupportPlanTariffs;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices.Queries;

public class GetSupportPlanTariffsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IStudentSupportSubscriptionRepository repository)
    : QueryHandler<GetSupportPlanTariffsQuery, List<SupportPlanTariffQri>>(outer)
{
    public override async Task<QueryResult<List<SupportPlanTariffQri>>> Handle(GetSupportPlanTariffsQuery query)
    {
        await repository.EnsureDefaultTariffsAsync();
        var tariffs = await repository.GetAllTariffsAsync();
        return await ResultAsync(tariffs.Select(SupportPlanTariffMapper.Map).ToList());
    }
}
