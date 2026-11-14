using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.ClosePlatformSupportTicket;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Commands;

public class ClosePlatformSupportTicketCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketCommandRepository ticketRepository,
    IPlatformSupportTicketRealtimeNotifier realtimeNotifier)
    : CommandHandler<ClosePlatformSupportTicketCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ClosePlatformSupportTicketCommand command)
    {
        if (command.UserId <= 0 || command.TicketId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var ticket = await ticketRepository.GetWithMessagesAsync(command.TicketId);
        if (ticket == null || ticket.IsDelete || !ticket.IsPlatformTicket() || !ticket.IsOwnedBy(command.UserId))
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (ticket.Status != PlatformSupportTicketStatus.Answered)
        {
            AddMessage("Only answered tickets can be closed.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            ticket.CloseWithRating(command.Rating, command.RatingComment);
        }
        catch (InvalidOperationException ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        await ticketRepository.CommitAsync();

        await realtimeNotifier.NotifyTicketStatusChangedAsync(new PlatformSupportTicketStatusChangedEvent(
            ticket.Id,
            ticket.Status,
            ticket.RequesterUserId ?? 0));
        await realtimeNotifier.NotifyAdminPulseAsync();

        return await OkAsync(ticket.Id.ToString());
    }
}
