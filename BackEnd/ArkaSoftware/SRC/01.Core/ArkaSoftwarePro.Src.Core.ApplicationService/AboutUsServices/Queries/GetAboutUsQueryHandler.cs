using ArkaSoftwarePro.Src.Core.Contracts.AboutUs.AboutUsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Queries.GetAboutUs;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.AboutUsServices.Queries
{
    public class GetAboutUsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IAboutUsQueryRepository aboutUsQueryRepository)
        : QueryHandler<GetAboutUsQuery, AboutUsQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<AboutUsQri>> Handle(GetAboutUsQuery query)
        {
            var result = await aboutUsQueryRepository.GetAboutUsExecuteAsync(query);
            if (result is null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
