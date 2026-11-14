using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetPlatformSupportTicketById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Queries;

public class GetMyPlatformSupportTicketsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketQueriesRepository repository)
    : QueryHandler<GetMyPlatformSupportTicketsQuery, List<PlatformSupportTicketListQri>>(outer)
{
    public override async Task<QueryResult<List<PlatformSupportTicketListQri>>> Handle(GetMyPlatformSupportTicketsQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.NotFound);

        var items = await repository.GetMyPlatformTicketsAsync(query.UserId);
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}

public class GetPlatformSupportTicketByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketQueriesRepository repository)
    : QueryHandler<GetPlatformSupportTicketByIdQuery, PlatformSupportTicketDetailQri>(outer)
{
    public override async Task<QueryResult<PlatformSupportTicketDetailQri>> Handle(GetPlatformSupportTicketByIdQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var detail = await repository.GetPlatformTicketByIdAsync(
            query.TicketId,
            query.UserId,
            query.MessageTake,
            query.BeforeMessageId);

        if (detail == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(detail, ApplicationServiceStatus.Ok);
    }
}

public class GetAdminPlatformSupportTicketByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketQueriesRepository repository,
    ISupportTicketCommandRepository ticketRepository,
    IUserNotificationCommandRepository notificationRepository,
    IEmailService emailService,
    IPlatformSupportTicketRealtimeNotifier realtimeNotifier)
    : QueryHandler<GetAdminPlatformSupportTicketByIdQuery, PlatformSupportTicketDetailQri>(outer)
{
    public override async Task<QueryResult<PlatformSupportTicketDetailQri>> Handle(GetAdminPlatformSupportTicketByIdQuery query)
    {
        if (query.StaffUserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var ticket = await ticketRepository.GetWithMessagesAsync(query.TicketId);
        if (ticket != null && !ticket.IsDelete && ticket.IsPlatformTicket())
        {
            var previousStatus = ticket.Status;
            var isFirstView = ticket.MarkFirstViewed(query.StaffUserId);
            if (isFirstView || previousStatus != ticket.Status)
            {
                await ticketRepository.CommitAsync();
                var displayCode = SupportTicketFormatting.FormatDisplayCode(ticket.DisplayNumber);
                var ticketLink = $"/support?ticket={ticket.Id}";

                if (isFirstView)
                {
                    try
                    {
                        await emailService.SendPlatformTicketViewedAsync(
                            ticket.RequesterEmail,
                            ticket.RequesterName,
                            displayCode,
                            ticket.Subject,
                            ticketLink,
                            CancellationToken.None);
                    }
                    catch
                    {
                        // Email failure must not block admin view.
                    }

                    if (ticket.RequesterUserId is > 0)
                    {
                        try
                        {
                            await notificationRepository.InsertAsync(UserNotification.Create(
                                ticket.RequesterUserId.Value,
                                "تیکت شما مشاهده شد",
                                $"تیکت {displayCode} توسط ادمین دیده شده و در حال بررسی است.",
                                "platform_ticket_viewed",
                                ticketLink,
                                ticket.Id));
                            await notificationRepository.CommitAsync();
                        }
                        catch
                        {
                            // Notification failure must not block admin view.
                        }
                    }
                }

                if (previousStatus != ticket.Status)
                {
                    try
                    {
                        if (ticket.RequesterUserId is > 0)
                        {
                            await realtimeNotifier.NotifyTicketStatusChangedAsync(new PlatformSupportTicketStatusChangedEvent(
                                ticket.Id,
                                ticket.Status,
                                ticket.RequesterUserId.Value));
                            await realtimeNotifier.NotifyUserPulseAsync(ticket.RequesterUserId.Value);
                        }
                        await realtimeNotifier.NotifyAdminPulseAsync();
                    }
                    catch
                    {
                        // Realtime failure must not block admin view.
                    }
                }
            }
        }

        var detail = await repository.GetAdminPlatformTicketByIdAsync(
            query.TicketId,
            query.MessageTake,
            query.BeforeMessageId);

        if (detail == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(detail, ApplicationServiceStatus.Ok);
    }
}
