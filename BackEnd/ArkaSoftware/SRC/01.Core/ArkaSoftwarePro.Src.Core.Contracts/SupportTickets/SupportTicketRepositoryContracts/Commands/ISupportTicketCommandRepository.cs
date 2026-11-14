using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;

public interface ISupportTicketCommandRepository : ICommandRepository<SupportTicket, long>
{
    Task<int> GetNextDisplayNumberAsync();
    Task<List<long>> GetAdminUserIdsAsync();
    Task<List<SupportTicketAdminRecipient>> GetAdminEmailRecipientsAsync();
    Task<SupportTicket?> GetWithMessagesAsync(long ticketId);
}
