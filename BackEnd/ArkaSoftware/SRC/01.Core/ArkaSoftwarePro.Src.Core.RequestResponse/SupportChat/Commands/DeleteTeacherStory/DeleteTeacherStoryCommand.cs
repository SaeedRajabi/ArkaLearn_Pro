using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.DeleteTeacherStory;

public class DeleteTeacherStoryCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long StoryId { get; set; }
    public bool IsAdmin { get; set; }
    public string Path => "/api/Service/SupportChat/DeleteStory";
}
