using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetPlatformSupportTicketById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetSupportTicketById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.SearchSupportTickets;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class SupportTicketQueryRepository(ArkaSoftwareQueryDbContext dbContext) : ISupportTicketQueriesRepository
{
    public async Task<SupportTicketQri?> GetByIdAsync(long ticketId)
    {
        return await dbContext.SupportTickets.AsNoTracking()
            .Where(x => x.Id == ticketId && !x.IsDelete)
            .Select(x => new SupportTicketQri
            {
                Id = x.Id,
                DisplayNumber = x.DisplayNumber,
                Subject = x.Subject,
                Message = x.Message,
                Status = x.Status,
                RequesterName = x.RequesterName,
                RequesterEmail = x.RequesterEmail,
                RequesterAvatarUrl = x.RequesterAvatarUrl,
                AdminReply = x.AdminReply,
                RepliedAt = x.RepliedAt,
                RepliedByUserId = x.RepliedByUserId,
                CreatedDateTime = x.CreatedDateTime,
            })
            .FirstOrDefaultAsync();
    }

    public async Task<PagedData<SearchSupportTicketQri>> SearchAsync(SearchSupportTicketsQuery query)
    {
        var pageNumber = query.PageNumber < 1 ? 1 : query.PageNumber;
        var pageSize = query.PageSize < 1 ? 20 : Math.Min(query.PageSize, 100);
        var input = (query.InputValue ?? string.Empty).Trim();

        var q = dbContext.SupportTickets.AsNoTracking().Where(x => !x.IsDelete);

        if (!string.IsNullOrWhiteSpace(query.Status))
            q = q.Where(x => x.Status == query.Status.Trim());

        if (!string.IsNullOrWhiteSpace(query.TicketSource))
            q = q.Where(x => x.TicketSource == query.TicketSource.Trim());

        if (!string.IsNullOrWhiteSpace(query.Department))
            q = q.Where(x => x.Department == query.Department.Trim());

        if (!string.IsNullOrWhiteSpace(input))
        {
            if (int.TryParse(input.Replace("ARKS-", "", StringComparison.OrdinalIgnoreCase).Trim(), out var displayNumber))
            {
                q = q.Where(x =>
                    x.DisplayNumber == displayNumber ||
                    x.Subject.Contains(input) ||
                    x.Message.Contains(input) ||
                    x.RequesterName.Contains(input) ||
                    x.RequesterEmail.Contains(input));
            }
            else
            {
                q = q.Where(x =>
                    x.Subject.Contains(input) ||
                    x.Message.Contains(input) ||
                    x.RequesterName.Contains(input) ||
                    x.RequesterEmail.Contains(input) ||
                    x.LastMessagePreview != null && x.LastMessagePreview.Contains(input));
            }
        }

        var total = query.NeedTotalCount ? await q.CountAsync() : 0;

        var items = await q
            .OrderByDescending(x => x.LastMessageAtUtc ?? x.CreatedDateTime)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new SearchSupportTicketQri
            {
                Id = x.Id,
                DisplayNumber = x.DisplayNumber,
                DisplayCode = $"ARKS-{x.DisplayNumber:D6}",
                TicketSource = x.TicketSource,
                Subject = x.Subject,
                Message = x.Message,
                Status = x.Status,
                Department = x.Department,
                RequesterName = x.RequesterName,
                RequesterEmail = x.RequesterEmail,
                CreatedDateTime = x.CreatedDateTime,
                LastMessageAtUtc = x.LastMessageAtUtc,
                LastMessagePreview = x.LastMessagePreview,
            })
            .ToListAsync();

        return new PagedData<SearchSupportTicketQri>
        {
            QueryResult = items,
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize,
        };
    }

    public async Task<List<PlatformSupportTicketListQri>> GetMyPlatformTicketsAsync(long userId)
    {
        return await dbContext.SupportTickets.AsNoTracking()
            .Where(x => !x.IsDelete &&
                        x.TicketSource == SupportTicketSource.Platform &&
                        x.RequesterUserId == userId)
            .OrderByDescending(x => x.LastMessageAtUtc ?? x.CreatedDateTime)
            .Select(x => new PlatformSupportTicketListQri
            {
                Id = x.Id,
                DisplayNumber = x.DisplayNumber,
                DisplayCode = $"ARKS-{x.DisplayNumber:D6}",
                Subject = x.Subject,
                Status = x.Status,
                Department = x.Department,
                CreatedDateTime = x.CreatedDateTime,
                LastMessageAtUtc = x.LastMessageAtUtc,
                LastMessagePreview = x.LastMessagePreview,
            })
            .ToListAsync();
    }

    public Task<PlatformSupportTicketDetailQri?> GetPlatformTicketByIdAsync(
        long ticketId,
        long userId,
        int messageTake,
        long? beforeMessageId)
        => BuildPlatformTicketDetailAsync(ticketId, userId, isAdmin: false, messageTake, beforeMessageId);

    public Task<PlatformSupportTicketDetailQri?> GetAdminPlatformTicketByIdAsync(
        long ticketId,
        int messageTake,
        long? beforeMessageId)
        => BuildPlatformTicketDetailAsync(ticketId, viewerUserId: 0, isAdmin: true, messageTake, beforeMessageId);

    private async Task<PlatformSupportTicketDetailQri?> BuildPlatformTicketDetailAsync(
        long ticketId,
        long viewerUserId,
        bool isAdmin,
        int messageTake,
        long? beforeMessageId)
    {
        messageTake = messageTake is > 0 and <= 50 ? messageTake : 10;

        var ticket = await dbContext.SupportTickets.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == ticketId && !x.IsDelete);
        if (ticket == null)
            return null;

        if (!isAdmin)
        {
            if (ticket.TicketSource != SupportTicketSource.Platform || ticket.RequesterUserId != viewerUserId)
                return null;
        }

        if (ticket.TicketSource != SupportTicketSource.Platform)
        {
            return new PlatformSupportTicketDetailQri
            {
                Id = ticket.Id,
                DisplayNumber = ticket.DisplayNumber,
                DisplayCode = SupportTicketFormatting.FormatDisplayCode(ticket.DisplayNumber),
                TicketSource = ticket.TicketSource,
                Subject = ticket.Subject,
                Status = ticket.Status,
                Department = ticket.Department,
                RequesterName = ticket.RequesterName,
                RequesterEmail = ticket.RequesterEmail,
                RequesterAvatarUrl = ticket.RequesterAvatarUrl,
                RequesterUserId = ticket.RequesterUserId,
                Message = ticket.Message,
                AdminReply = ticket.AdminReply,
                FirstViewedAtUtc = ticket.FirstViewedAtUtc,
                ClosedAtUtc = ticket.ClosedAtUtc,
                Rating = ticket.Rating,
                RatingComment = ticket.RatingComment,
                CreatedDateTime = ticket.CreatedDateTime,
                HasMoreOlderMessages = false,
                Messages = [],
            };
        }

        var messagesQuery = dbContext.SupportTicketMessages.AsNoTracking()
            .Where(m => m.TicketId == ticketId && !m.IsDelete);

        if (beforeMessageId is > 0)
        {
            var beforeMessage = await dbContext.SupportTicketMessages.AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == beforeMessageId.Value && m.TicketId == ticketId);
            if (beforeMessage != null)
            {
                var beforeSentAt = beforeMessage.SentAtUtc;
                var beforeId = beforeMessage.Id;
                messagesQuery = messagesQuery.Where(m =>
                    m.SentAtUtc < beforeSentAt ||
                    (m.SentAtUtc == beforeSentAt && m.Id < beforeId));
            }
        }

        var messages = await messagesQuery
            .OrderByDescending(m => m.SentAtUtc)
            .ThenByDescending(m => m.Id)
            .Take(messageTake)
            .ToListAsync();
        messages.Reverse();

        var hasMoreOlderMessages = false;
        if (messages.Count > 0)
        {
            var oldest = messages[0];
            hasMoreOlderMessages = await dbContext.SupportTicketMessages.AsNoTracking()
                .AnyAsync(m =>
                    m.TicketId == ticketId &&
                    !m.IsDelete &&
                    (m.SentAtUtc < oldest.SentAtUtc ||
                     (m.SentAtUtc == oldest.SentAtUtc && m.Id < oldest.Id)));
        }

        var replyIds = messages
            .Where(m => m.ReplyToMessageId is > 0)
            .Select(m => m.ReplyToMessageId!.Value)
            .Distinct()
            .ToList();

        var replyTargets = replyIds.Count == 0
            ? []
            : await dbContext.SupportTicketMessages.AsNoTracking()
                .Where(m => m.TicketId == ticketId && replyIds.Contains(m.Id))
                .ToListAsync();
        var replyMap = replyTargets.ToDictionary(m => m.Id);

        var senderIds = messages.Select(m => m.SenderUserId).Distinct().ToList();
        if (ticket.RequesterUserId is > 0)
            senderIds.Add(ticket.RequesterUserId.Value);
        senderIds = senderIds.Distinct().ToList();

        var users = await dbContext.Users.AsNoTracking()
            .Where(u => senderIds.Contains(u.Id))
            .ToListAsync();
        var nameMap = users.ToDictionary(u => u.Id, BuildUserDisplayName);

        var messageRows = messages.Select(m =>
        {
            replyMap.TryGetValue(m.ReplyToMessageId ?? 0, out var replyTarget);
            return new PlatformSupportTicketMessageQri
            {
                Id = m.Id,
                SenderUserId = m.SenderUserId,
                SenderName = m.IsStaffMessage
                    ? PlatformSupportTicketStaffNames.DisplayNameFa
                    : nameMap.GetValueOrDefault(m.SenderUserId, "کاربر"),
                ContentHtml = m.ContentHtml,
                SentAtUtc = m.SentAtUtc,
                IsMine = !isAdmin && m.SenderUserId == viewerUserId && !m.IsStaffMessage,
                IsStaffMessage = m.IsStaffMessage,
                IsDeleted = m.IsDelete,
                EditedAtUtc = m.EditedAtUtc,
                ReplyToMessageId = m.ReplyToMessageId,
                ReplyToSenderName = replyTarget == null
                    ? null
                    : replyTarget.IsStaffMessage
                        ? PlatformSupportTicketStaffNames.DisplayNameFa
                        : nameMap.GetValueOrDefault(replyTarget.SenderUserId, "کاربر"),
                ReplyToContentPreview = replyTarget == null
                    ? null
                    : SupportTicketFormatting.StripHtml(replyTarget.ContentHtml, 80),
            };
        }).ToList();

        return new PlatformSupportTicketDetailQri
        {
            Id = ticket.Id,
            DisplayNumber = ticket.DisplayNumber,
            DisplayCode = SupportTicketFormatting.FormatDisplayCode(ticket.DisplayNumber),
            TicketSource = ticket.TicketSource,
            Subject = ticket.Subject,
            Status = ticket.Status,
            Department = ticket.Department,
            RequesterName = ticket.RequesterName,
            RequesterEmail = ticket.RequesterEmail,
            RequesterAvatarUrl = ticket.RequesterAvatarUrl,
            RequesterUserId = ticket.RequesterUserId,
            Message = ticket.Message,
            AdminReply = ticket.AdminReply,
            FirstViewedAtUtc = ticket.FirstViewedAtUtc,
            ClosedAtUtc = ticket.ClosedAtUtc,
            Rating = ticket.Rating,
            RatingComment = ticket.RatingComment,
            CreatedDateTime = ticket.CreatedDateTime,
            HasMoreOlderMessages = hasMoreOlderMessages,
            Messages = messageRows,
        };
    }

    private static string BuildUserDisplayName(
        ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users.UserQueryModel user)
    {
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        if (!string.IsNullOrWhiteSpace(fullName))
            return fullName;
        if (!string.IsNullOrWhiteSpace(user.UserName))
            return user.UserName;
        return user.Email ?? "کاربر";
    }
}

internal static class PlatformSupportTicketStaffNames
{
    public const string DisplayNameFa = "پشتیبانی سایت";
}
