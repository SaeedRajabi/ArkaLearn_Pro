namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles;

public sealed record UserFileSnapshot(long Id, long UserId, long? ParentId, string Name, bool IsFolder,
    string? FileUrl, long FileSize, DateTime CreatedAt, long? UploadedByUserId);

public sealed record FileOwnerIdentity(string? UserName, string? Email, string? FirstName, string? LastName);
