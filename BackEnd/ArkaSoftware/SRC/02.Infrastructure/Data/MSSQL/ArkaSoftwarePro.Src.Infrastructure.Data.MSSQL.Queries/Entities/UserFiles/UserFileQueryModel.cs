namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.UserFiles;

public class UserFileQueryModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsFolder { get; set; }
    public string? FileUrl { get; set; }
    public long FileSize { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Audit column — who last modified (also set on create for uploads).</summary>
    public string? ModifiedByUserId { get; set; }

    /// <summary>Audit column — who created the row.</summary>
    public string? CreatedByUserId { get; set; }

    /// <summary>
    /// Uploader portal user id, resolved from ModifiedByUserId (preferred) or CreatedByUserId.
    /// Not a physical DB column.
    /// </summary>
    public long? UploadedByUserId
    {
        get
        {
            if (TryParseUserId(ModifiedByUserId, out var modified))
                return modified;
            if (TryParseUserId(CreatedByUserId, out var created))
                return created;
            return null;
        }
    }

    private static bool TryParseUserId(string? raw, out long userId)
    {
        userId = 0;
        if (string.IsNullOrWhiteSpace(raw))
            return false;
        return long.TryParse(raw.Trim(), out userId) && userId > 0;
    }
}
