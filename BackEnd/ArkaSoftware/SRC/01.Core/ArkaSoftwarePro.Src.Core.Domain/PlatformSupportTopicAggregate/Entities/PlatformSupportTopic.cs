using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.PlatformSupportTopicAggregate.Entities;

/// <summary>Read-only FAQ-style topic shown on the platform support page.</summary>
public class PlatformSupportTopic : AggregateRoot
{
    private const int MaxTitleLength = 300;
    private const int MaxSummaryLength = 500;
    private const int MaxDepartmentLength = 50;

    public string Title { get; private set; } = string.Empty;
    public string Summary { get; private set; } = string.Empty;
    public string ContentHtml { get; private set; } = string.Empty;
    public string? Department { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsPublished { get; private set; }

    private PlatformSupportTopic()
    {
    }

    public PlatformSupportTopic(
        string title,
        string summary,
        string contentHtml,
        string? department,
        int sortOrder,
        bool isPublished)
    {
        Update(title, summary, contentHtml, department, sortOrder, isPublished);
    }

    public void Update(
        string title,
        string summary,
        string contentHtml,
        string? department,
        int sortOrder,
        bool isPublished)
    {
        Title = Truncate(title?.Trim() ?? string.Empty, MaxTitleLength);
        Summary = Truncate(summary?.Trim() ?? string.Empty, MaxSummaryLength);
        ContentHtml = contentHtml ?? string.Empty;
        Department = NormalizeDepartment(department);
        SortOrder = sortOrder;
        IsPublished = isPublished;
    }

    public void SoftDelete()
    {
        if (IsDelete)
            return;

        IsDelete = true;
    }

    private static string? NormalizeDepartment(string? department)
    {
        var trimmed = department?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
            return null;

        return Truncate(trimmed, MaxDepartmentLength);
    }

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
