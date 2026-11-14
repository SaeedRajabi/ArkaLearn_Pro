using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.SearchSupportTickets;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Queries;

public class SearchSupportTicketsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketQueriesRepository repository)
    : QueryHandler<SearchSupportTicketsQuery, PagedData<SearchSupportTicketQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SearchSupportTicketQri>>> Handle(SearchSupportTicketsQuery query)
    {
        var result = await repository.SearchAsync(query);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
