using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.RegisterTeacherStoryView;

public class RegisterTeacherStoryViewCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long StoryId { get; set; }
    public string Path => "/api/Service/SupportChat/RegisterStoryView";
}
