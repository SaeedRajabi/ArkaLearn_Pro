using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherResume : Entity
{
    public long TeacherId { get; private set; }
    public Teacher? Teacher { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string PdfFileUrl { get; private set; } = string.Empty;
    public string? PdfFileName { get; private set; }
    public TeacherApprovalStatus ApprovalStatus { get; private set; } = TeacherApprovalStatus.Draft;
    public DateTime? SubmittedAtUtc { get; private set; }
    public string? ApprovedSnapshotJson { get; private set; }

    private TeacherResume() { }

    public static TeacherResume Create(string title, string description, string pdfFileUrl, string? pdfFileName)
    {
        return new TeacherResume
        {
            Title = title.Trim(),
            Description = description.Trim(),
            PdfFileUrl = pdfFileUrl.Trim(),
            PdfFileName = string.IsNullOrWhiteSpace(pdfFileName) ? null : pdfFileName.Trim(),
            ApprovalStatus = TeacherApprovalStatus.Draft,
        };
    }

    public void Update(string title, string description, string pdfFileUrl, string? pdfFileName)
    {
        Title = title.Trim();
        Description = description.Trim();
        PdfFileUrl = pdfFileUrl.Trim();
        PdfFileName = string.IsNullOrWhiteSpace(pdfFileName) ? null : pdfFileName.Trim();
    }

    public void SubmitForReview()
    {
        ApprovalStatus = TeacherApprovalStatus.Pending;
        SubmittedAtUtc = DateTime.UtcNow;
    }

    public void SetApprovalStatus(TeacherApprovalStatus status) => ApprovalStatus = status;

    public void SetApprovedSnapshot(string snapshotJson) => ApprovedSnapshotJson = snapshotJson;
}
