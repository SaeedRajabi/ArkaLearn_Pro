using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.ReplySupportTicket;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Commands;

public class ReplySupportTicketCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketCommandRepository ticketRepository,
    IEmailService emailService)
    : CommandHandler<ReplySupportTicketCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ReplySupportTicketCommand command)
    {
        var reply = (command.ReplyMessage ?? string.Empty).Trim();
        if (reply.Length < 5)
        {
            AddMessage("Reply message is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (command.TicketId <= 0 || command.ReviewerUserId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var ticket = await ticketRepository.GetGraphAsync(command.TicketId);
        if (ticket == null || ticket.IsDelete)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (ticket.TicketSource != SupportTicketSource.Contact)
        {
            AddMessage("Use the platform ticket messaging endpoint for this ticket.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (!string.IsNullOrWhiteSpace(ticket.AdminReply))
        {
            AddMessage("This ticket has already been replied to.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        ticket.Reply(reply, command.ReviewerUserId);
        await ticketRepository.CommitAsync();

        var subject = $"Re: {ticket.Subject}";
        await emailService.SendContactReplyAsync(
            ticket.RequesterEmail,
            ticket.RequesterName,
            subject,
            reply,
            CancellationToken.None);

        return await OkAsync(ticket.Id.ToString());
    }
}
