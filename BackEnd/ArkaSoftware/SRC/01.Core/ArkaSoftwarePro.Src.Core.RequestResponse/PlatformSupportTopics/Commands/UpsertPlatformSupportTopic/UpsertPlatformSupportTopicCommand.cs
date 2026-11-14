using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Commands.UpsertPlatformSupportTopic;

public class UpsertPlatformSupportTopicCommand : ICommand<string>, IWebRequest
{
    public long? Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string? Department { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
    public string Path => "/api/Service/PlatformSupportTopic/Upsert";
}
