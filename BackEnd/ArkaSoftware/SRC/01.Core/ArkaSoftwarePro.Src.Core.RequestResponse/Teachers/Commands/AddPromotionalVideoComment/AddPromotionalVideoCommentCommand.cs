using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AddPromotionalVideoComment;

public class AddPromotionalVideoCommentCommand : ICommand<string>, IWebRequest
{
    public long VideoId { get; set; }
    public string Content { get; set; } = string.Empty;
    public long? ParentId { get; set; }
    public string Path => "/api/Service/Teacher/AddPromotionalVideoComment";
}
