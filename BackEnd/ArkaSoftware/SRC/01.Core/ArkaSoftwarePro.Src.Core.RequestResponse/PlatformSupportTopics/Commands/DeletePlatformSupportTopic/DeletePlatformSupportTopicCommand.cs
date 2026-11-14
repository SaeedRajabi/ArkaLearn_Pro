using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Commands.DeletePlatformSupportTopic;

public class DeletePlatformSupportTopicCommand : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public string Path => "/api/Service/PlatformSupportTopic/Delete";
}
