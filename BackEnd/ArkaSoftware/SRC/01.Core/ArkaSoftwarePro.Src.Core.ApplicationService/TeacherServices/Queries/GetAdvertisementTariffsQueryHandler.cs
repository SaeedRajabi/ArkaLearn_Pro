using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementTariffs;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetAdvertisementTariffsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository)
    : QueryHandler<GetAdvertisementTariffsQuery, List<AdvertisementTariffQri>>(outer)
{
    public override async Task<QueryResult<List<AdvertisementTariffQri>>> Handle(GetAdvertisementTariffsQuery query)
    {
        await teacherCommandRepository.EnsureDefaultTariffsAsync();
        var tariffs = await teacherCommandRepository.GetActiveTariffsAsync();
        var result = tariffs.Select(t => new AdvertisementTariffQri
        {
            Id = t.Id,
            DurationMonths = t.DurationMonths,
            StarLevel = t.StarLevel,
            PriceToman = t.PriceToman,
            DiscountPercent = t.DiscountPercent,
            IsActive = t.IsActive,
        }).ToList();
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
