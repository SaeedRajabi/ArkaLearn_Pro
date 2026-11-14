using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Entities;

public class ProjectOrder : AggregateRoot
{
    public int RequestNumber { get; private set; }
    public long? UserId { get; private set; }
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string ProjectType { get; private set; } = string.Empty;
    public string DescriptionHtml { get; private set; } = string.Empty;
    public ProjectOrderStatus Status { get; private set; }
    public string? AdminNote { get; private set; }
    public long? ReviewedByUserId { get; private set; }
    public DateTime? ReviewedAt { get; private set; }

    private ProjectOrder() { }

    public static ProjectOrder SubmitGuest(
        int requestNumber,
        string firstName,
        string lastName,
        string phone,
        string title,
        string projectType)
    {
        return new ProjectOrder
        {
            RequestNumber = requestNumber,
            UserId = null,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Phone = phone.Trim(),
            Title = title.Trim(),
            ProjectType = projectType.Trim(),
            DescriptionHtml = string.Empty,
            Status = ProjectOrderStatus.Submitted,
        };
    }

    public void Review(ProjectOrderStatus status, long reviewedByUserId, string? adminNote)
    {
        if (status is not (ProjectOrderStatus.Approved or ProjectOrderStatus.Rejected))
            return;

        Status = status;
        ReviewedByUserId = reviewedByUserId;
        ReviewedAt = DateTime.UtcNow;
        AdminNote = string.IsNullOrWhiteSpace(adminNote) ? null : adminNote.Trim();
    }
}
