using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SubmitSupportConversationRating;

public class SubmitSupportConversationRatingCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ConversationId { get; set; }
    public byte RatingLevel { get; set; }
    public string? Feedback { get; set; }
    public string Path => "/api/Service/SupportChat/SubmitRating";
}
