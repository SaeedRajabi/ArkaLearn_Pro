using ArkaSoftwarePro.Src.Core.Contracts.ContactUs.ContactUsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ContactUs.Queries.GetContactUs;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ContactUsServices.Queries
{
    public class GetContactUsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IContactUsQueryRepository contactUsQueryRepository)
        : QueryHandler<GetContactUsQuery, ContactUsQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<ContactUsQri>> Handle(GetContactUsQuery query)
        {
            var result = await contactUsQueryRepository.GetContactUsExecuteAsync(query);
            if (result is null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
