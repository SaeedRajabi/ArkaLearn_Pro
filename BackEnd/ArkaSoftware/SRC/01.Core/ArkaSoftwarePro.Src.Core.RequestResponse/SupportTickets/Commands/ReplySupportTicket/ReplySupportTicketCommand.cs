using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.ReplySupportTicket;

public class ReplySupportTicketCommand : ICommand<string>
{
    public long TicketId { get; set; }
    public string ReplyMessage { get; set; } = string.Empty;
    public long ReviewerUserId { get; set; }
}
