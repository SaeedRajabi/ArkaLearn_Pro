using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.ListPlatformSupportTopics;

public class ListPlatformSupportTopicsQuery : IQuery<List<PlatformSupportTopicListItemQri>>, IWebRequest
{
    public string Path => "/api/Service/PlatformSupportTopic/List";
}

public class ListPublishedPlatformSupportTopicsQuery : IQuery<List<PlatformSupportTopicListItemQri>>, IWebRequest
{
    public string Path => "/api/Service/PlatformSupportTopic/ListPublished";
}

public sealed class PlatformSupportTopicListItemQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? Department { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public bool IsAdminTopic { get; set; } = true;
}
