namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.PlatformSupportTopics;

public class PlatformSupportTopicQueryModel
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string? Department { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public bool IsDelete { get; set; }
}
