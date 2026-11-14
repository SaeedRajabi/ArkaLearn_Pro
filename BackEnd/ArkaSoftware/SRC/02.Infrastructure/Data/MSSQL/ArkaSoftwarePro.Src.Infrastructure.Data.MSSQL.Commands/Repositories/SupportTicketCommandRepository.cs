using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class SupportTicketCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<SupportTicket, ArkaSoftwareCommandDbContext>(dbContext), ISupportTicketCommandRepository
{
    public async Task<int> GetNextDisplayNumberAsync()
    {
        var max = await _dbContext.SupportTickets.AsNoTracking()
            .MaxAsync(x => (int?)x.DisplayNumber) ?? 0;
        return max + 1;
    }

    public async Task<List<long>> GetAdminUserIdsAsync()
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.Role == UserRole.ADMIN && !x.IsDelete)
            .Select(x => x.Id)
            .ToListAsync();
    }

    public async Task<List<SupportTicketAdminRecipient>> GetAdminEmailRecipientsAsync()
    {
        var admins = await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.Role == UserRole.ADMIN && !x.IsDelete)
            .ToListAsync();

        return admins
            .Select(x => new SupportTicketAdminRecipient(
                x.EmailValue,
                BuildAdminDisplayName(x)))
            .Where(x => !string.IsNullOrWhiteSpace(x.Email))
            .ToList();
    }

    private static string BuildAdminDisplayName(ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities.User user)
    {
        var fullName = user.UserFullName != null
            ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
            : string.Empty;
        if (!string.IsNullOrWhiteSpace(fullName)) return fullName;
        if (!string.IsNullOrWhiteSpace(user.UserNameValue)) return user.UserNameValue;
        return user.EmailValue;
    }

    public async Task<SupportTicket?> GetWithMessagesAsync(long ticketId)
    {
        return await _dbContext.SupportTickets
            .Include(x => x.Messages)
            .FirstOrDefaultAsync(x => x.Id == ticketId && !x.IsDelete);
    }
}
