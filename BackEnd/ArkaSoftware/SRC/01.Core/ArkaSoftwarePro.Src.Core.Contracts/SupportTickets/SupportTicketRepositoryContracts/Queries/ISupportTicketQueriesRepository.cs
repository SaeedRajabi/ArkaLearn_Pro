using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetPlatformSupportTicketById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetSupportTicketById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.SearchSupportTickets;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Queries;

public interface ISupportTicketQueriesRepository : IQueryRepository
{
    Task<SupportTicketQri?> GetByIdAsync(long ticketId);
    Task<PagedData<SearchSupportTicketQri>> SearchAsync(SearchSupportTicketsQuery query);
    Task<List<PlatformSupportTicketListQri>> GetMyPlatformTicketsAsync(long userId);
    Task<PlatformSupportTicketDetailQri?> GetPlatformTicketByIdAsync(
        long ticketId,
        long userId,
        int messageTake,
        long? beforeMessageId);
    Task<PlatformSupportTicketDetailQri?> GetAdminPlatformTicketByIdAsync(
        long ticketId,
        int messageTake,
        long? beforeMessageId);
}
