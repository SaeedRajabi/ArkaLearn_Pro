using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.CreatePlatformSupportTicket;

public class CreatePlatformSupportTicketCommand : ICommand<string>
{
    public long UserId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
}
