namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Queries.GetUserFiles;

public class GetUserFilesQri
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsFolder { get; set; }
    public string? FileUrl { get; set; }
    public long FileSize { get; set; }
    public DateTime CreatedAt { get; set; }
}