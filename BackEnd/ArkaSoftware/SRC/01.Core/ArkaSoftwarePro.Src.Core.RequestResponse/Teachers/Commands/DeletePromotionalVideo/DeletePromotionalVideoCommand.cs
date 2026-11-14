using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.DeletePromotionalVideo;

public class DeletePromotionalVideoCommand : ICommand<string>, IWebRequest
{
    public long VideoId { get; set; }
    public long? TeacherUserId { get; set; }
    public string Path => "/api/Service/Teacher/DeletePromotionalVideo";
}
