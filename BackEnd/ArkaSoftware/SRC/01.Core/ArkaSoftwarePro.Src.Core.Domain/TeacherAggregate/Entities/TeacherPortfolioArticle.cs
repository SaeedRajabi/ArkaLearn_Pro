using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherPortfolioArticle : Entity
{
    public long TeacherId { get; private set; }
    public Teacher? Teacher { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Summary { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public TeacherApprovalStatus ApprovalStatus { get; private set; } = TeacherApprovalStatus.Draft;
    public int SortOrder { get; private set; }
    public string? ApprovedSnapshotJson { get; private set; }

    private TeacherPortfolioArticle() { }

    public static TeacherPortfolioArticle Create(string title, string summary, string content, int sortOrder = 0)
    {
        return new TeacherPortfolioArticle
        {
            Title = title.Trim(),
            Summary = summary.Trim(),
            Content = content.Trim(),
            SortOrder = sortOrder,
            ApprovalStatus = TeacherApprovalStatus.Draft,
        };
    }

    public void Update(string title, string summary, string content, int sortOrder)
    {
        Title = title.Trim();
        Summary = summary.Trim();
        Content = content.Trim();
        SortOrder = sortOrder;
        ApprovalStatus = TeacherApprovalStatus.Pending;
    }

    public void SetApprovalStatus(TeacherApprovalStatus status) => ApprovalStatus = status;

    public void SetApprovedSnapshot(string snapshotJson) => ApprovedSnapshotJson = snapshotJson;
}
