using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SendPlatformSupportTicketMessage;

public class SendPlatformSupportTicketMessageCommand : ICommand<string>
{
    public long UserId { get; set; }
    public long TicketId { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public long? ReplyToMessageId { get; set; }
    public bool IsStaffMessage { get; set; }
}
