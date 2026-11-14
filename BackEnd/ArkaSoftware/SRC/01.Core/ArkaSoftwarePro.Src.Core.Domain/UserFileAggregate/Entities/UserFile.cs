using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.UserFileAggregate.Entities;

public class UserFile : AggregateRoot
{
    public long UserId { get; private set; }
    public long? ParentId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public bool IsFolder { get; private set; }
    public string? FileUrl { get; private set; }
    public long FileSize { get; private set; }
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Portal user id of the teacher/admin who uploaded or created this item.
    /// Not persisted as its own column — written to auditable ModifiedByUserId on save.
    /// </summary>
    public long? UploadedByUserId { get; private set; }

    private UserFile() { }

    public static UserFile CreateFolder(long userId, long? parentId, string name, long? uploadedByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Folder name is required.", nameof(name));

        return new UserFile
        {
            UserId = userId,
            ParentId = parentId,
            Name = name.Trim(),
            IsFolder = true,
            FileUrl = null,
            FileSize = 0,
            CreatedAt = DateTime.UtcNow,
            UploadedByUserId = uploadedByUserId is > 0 ? uploadedByUserId : null
        };
    }

    public static UserFile CreateFile(
        long userId,
        long? parentId,
        string name,
        string fileUrl,
        long fileSize,
        long? uploadedByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("File name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(fileUrl))
            throw new ArgumentException("File URL is required.", nameof(fileUrl));

        return new UserFile
        {
            UserId = userId,
            ParentId = parentId,
            Name = name.Trim(),
            IsFolder = false,
            FileUrl = fileUrl.Trim(),
            FileSize = fileSize >= 0 ? fileSize : 0,
            CreatedAt = DateTime.UtcNow,
            UploadedByUserId = uploadedByUserId is > 0 ? uploadedByUserId : null
        };
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required.", nameof(name));

        Name = name.Trim();
    }
}
