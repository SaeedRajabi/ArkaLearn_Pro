using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetSupportTicketById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Queries;

public class GetSupportTicketByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketQueriesRepository repository)
    : QueryHandler<GetSupportTicketByIdQuery, SupportTicketQri>(outer)
{
    public override async Task<QueryResult<SupportTicketQri>> Handle(GetSupportTicketByIdQuery query)
    {
        var item = await repository.GetByIdAsync(query.TicketId);
        if (item == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(item, ApplicationServiceStatus.Ok);
    }
}
