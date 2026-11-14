namespace ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

public sealed record UploadContent(string FileName, string ContentType, long Length, Func<Stream> OpenReadStream);

public static class FileUploadLimits
{
    public const long StudentFileSize = 3L * 1024 * 1024 * 1024;
    public const long RoomFileSize = 50L * 1024 * 1024;
    public const int DefaultChunkSize = 2 * 1024 * 1024;
    public const int MaxChunkSize = 8 * 1024 * 1024;
}
