namespace ArkaSoftwarePro.Src.Core.RequestResponse.FileStorage;

public sealed record CurriculumMaterialDownload(long CourseId, long MediaAssetId, string DisplayName);
public sealed record MediaAssetDownload(string FileUrl, string? OriginalFileName, string? MimeType, bool IsEncrypted);
public sealed record PublishedInstaller(string Version, string InstallerUrl);
