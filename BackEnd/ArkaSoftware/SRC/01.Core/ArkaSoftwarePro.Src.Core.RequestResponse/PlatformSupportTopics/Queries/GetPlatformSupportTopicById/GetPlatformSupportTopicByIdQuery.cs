using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.GetPlatformSupportTopicById;

public class GetPlatformSupportTopicByIdQuery : IQuery<PlatformSupportTopicDetailQri>, IWebRequest
{
    public long Id { get; set; }
    public string Path => "/api/Service/PlatformSupportTopic/GetById";
}

public class GetPublishedPlatformSupportTopicByIdQuery : IQuery<PlatformSupportTopicDetailQri>, IWebRequest
{
    public long Id { get; set; }
    public string Path => "/api/Service/PlatformSupportTopic/GetPublishedById";
}

public sealed class PlatformSupportTopicDetailQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string? Department { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public bool IsAdminTopic { get; set; } = true;
}
