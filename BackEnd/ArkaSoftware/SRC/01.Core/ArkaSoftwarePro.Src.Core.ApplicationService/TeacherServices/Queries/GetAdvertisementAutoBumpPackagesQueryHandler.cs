using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementAutoBumpPackages;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetAdvertisementAutoBumpPackagesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository)
    : QueryHandler<GetAdvertisementAutoBumpPackagesQuery, List<AdvertisementAutoBumpPackageQri>>(outer)
{
    public override async Task<QueryResult<List<AdvertisementAutoBumpPackageQri>>> Handle(GetAdvertisementAutoBumpPackagesQuery query)
    {
        await teacherCommandRepository.EnsureDefaultAutoBumpPackagesAsync();
        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        var packages = await teacherCommandRepository.GetActiveAutoBumpPackagesAsync();
        var result = packages.Select(p => new AdvertisementAutoBumpPackageQri
        {
            Id = p.Id,
            Name = p.Name,
            DurationDays = p.DurationDays,
            PriceToman = p.PriceToman,
            IsActive = p.IsActive,
        }).ToList();

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
