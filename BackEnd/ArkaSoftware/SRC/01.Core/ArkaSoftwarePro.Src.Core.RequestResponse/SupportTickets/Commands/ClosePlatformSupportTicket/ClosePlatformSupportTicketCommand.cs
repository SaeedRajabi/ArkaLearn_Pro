using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.ClosePlatformSupportTicket;

public class ClosePlatformSupportTicketCommand : ICommand<string>
{
    public long UserId { get; set; }
    public long TicketId { get; set; }
    public int? Rating { get; set; }
    public string? RatingComment { get; set; }
}
