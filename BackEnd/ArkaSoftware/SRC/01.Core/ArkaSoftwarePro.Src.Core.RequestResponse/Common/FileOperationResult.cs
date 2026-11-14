namespace ArkaSoftwarePro.Src.Core.RequestResponse.Common;

public enum FileOperationOutcome
{
    Success, Created, Invalid, Missing, Unauthenticated, Denied, Conflict, StorageFailure, Download, Redirect, NoContent
}

public sealed record FileDownload(Stream Content, string ContentType, string FileName);

public sealed record FileOperationResult(FileOperationOutcome Kind, object? Data = null)
{
    public bool IsFailure => Kind is not (FileOperationOutcome.Success or FileOperationOutcome.Created or FileOperationOutcome.Download or FileOperationOutcome.Redirect or FileOperationOutcome.NoContent);
    public static FileOperationResult Success(object? data = null) => new(FileOperationOutcome.Success, data);
    public static FileOperationResult Invalid(object? data = null) => new(FileOperationOutcome.Invalid, data);
    public static FileOperationResult Missing(object? data = null) => new(FileOperationOutcome.Missing, data);
    public static FileOperationResult Unauthenticated() => new(FileOperationOutcome.Unauthenticated);
    public static FileOperationResult Denied(object? data = null) => new(FileOperationOutcome.Denied, data);
    public static FileOperationResult Conflict(object? data = null) => new(FileOperationOutcome.Conflict, data);
    public static FileOperationResult StorageFailure(object? data = null) => new(FileOperationOutcome.StorageFailure, data);
    public static FileOperationResult Redirect(string url) => new(FileOperationOutcome.Redirect, url);
    public static FileOperationResult Download(Stream content, string contentType, string fileName) =>
        new(FileOperationOutcome.Download, new FileDownload(content, contentType, fileName));
}
