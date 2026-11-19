using Microsoft.Extensions.Logging;
using ArkaSoftwarePro.Src.Core.ApplicationService.Common;
using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Uploads;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Common;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRoomFile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.DeleteRoomFile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Uploads;
using Framework.Src.Core.Contracts.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Common;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices;

public sealed class RoomFileApplicationService(IRemoteUploadStorage fileStorage, ILegacyFileStore legacyFiles,
    RoomFileUploadSessionStore sessions, ICurrentActor actor, ApplicationCommandExecutor commands, ICommandDispatcher dispatcher,
    ILogger<RoomFileApplicationService> logger)
{
    private const long MaxFileSizeBytes = FileUploadLimits.RoomFileSize;
    private const int DefaultChunkSizeBytes = FileUploadLimits.DefaultChunkSize;
    private const int MaxChunkSizeBytes = FileUploadLimits.MaxChunkSize;
    private const int MaxRoomFileTitleLength = 200;
    private const int MaxRoomFileDescriptionLength = 1000;
    public async Task<FileOperationResult> DeleteRoomFile(DeleteRoomFileCommand command)
    {
        if (!actor.Principal.TryGetLongUserId(out var userId))
            return FileOperationResult.Unauthenticated();

        command.RequestingUserId = userId;
        command.RequestingIsDashboardAdmin = actor.Principal.IsDashboardAdminRole();

        var result = await dispatcher.Send<DeleteRoomFileCommand, object>(command);
        if (result.Status == ApplicationServiceStatus.Ok)
        {
            TryDeleteRoomPhysicalFile(ExtractFileUrl(result.Data));
            return FileOperationResult.Success(result.Data);
        }

        if (result.Status == ApplicationServiceStatus.NotFound)
            return FileOperationResult.Missing(new { ErrorMessages = result.Data, JsonData = command });

        return FileOperationResult.Invalid(result.Messages);
    }

    public async Task<FileOperationResult> UploadRoomFile(RoomFileUpload<UploadContent> updateRoomFile)
    {
        if (updateRoomFile.File == null || updateRoomFile.File.Length == 0)
            return FileOperationResult.Invalid(new { message = "No file uploaded." });
        if (updateRoomFile.File.Length > MaxFileSizeBytes)
            return FileOperationResult.Invalid(new { message = "File size must not exceed 50 MB." });
        if (updateRoomFile.FileType < 1 || updateRoomFile.FileType > 5)
            return FileOperationResult.Invalid(new { message = "FileType must be 1 (Video), 2 (Audio), 3 (Slide), 4 (Recording), or 5 (SharedFile)." });

        var originalFileName = updateRoomFile.File.FileName.Trim();
        var title = ResolveRoomFileTitle(updateRoomFile.Title, originalFileName);
        if (string.IsNullOrWhiteSpace(title))
            return FileOperationResult.Invalid(new { message = "Title is required." });
        var description = NormalizeRoomFileMetadata(updateRoomFile.Description, MaxRoomFileDescriptionLength);

        var ext = Path.GetExtension(updateRoomFile.File.FileName);
        if (string.IsNullOrEmpty(ext)) ext = ".bin";
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var relativeUrl = "/rooms/files/" + updateRoomFile.RoomId + "/" + fileName;
        var objectKey = $"rooms/files/{updateRoomFile.RoomId}/{fileName}";
        var contentType = string.IsNullOrWhiteSpace(updateRoomFile.File.ContentType)
            ? "application/octet-stream"
            : updateRoomFile.File.ContentType;

        await using (var stream = updateRoomFile.File.OpenReadStream())
        {
            await fileStorage.PutAsync(
                objectKey,
                stream,
                contentType,
                FileAccessTier.Private);
        }

        var command = new AddRoomFileCommand
        {
            RoomId = updateRoomFile.RoomId,
            FileType = (RoomFileType)updateRoomFile.FileType,
            Title = title,
            Description = description,
            FileName = originalFileName,
            FileUrl = relativeUrl,
            FileSize = updateRoomFile.File.Length,
            UploadedByUserId = actor.Principal.TryGetLongUserId(out var uid) ? uid.ToString() : null
        };
        var result = await commands.Create<AddRoomFileCommand, object>(command);
        if (result.IsFailure)
            await fileStorage.DeleteAsync(fileStorage.ToObjectKey(relativeUrl, FileAccessTier.Private));
        return result;
    }

    public async Task<FileOperationResult> UploadRoomFileInit(UploadFileInitRequest request)
    {
        await CleanupExpiredChunkSessionsAsync();

        if (request.RoomId <= 0)
            return FileOperationResult.Invalid(new { message = "roomId is required." });
        if (request.FileType < 1 || request.FileType > 5)
            return FileOperationResult.Invalid(new { message = "Invalid fileType." });
        if (request.FileSize <= 0 || request.FileSize > MaxFileSizeBytes)
            return FileOperationResult.Invalid(new { message = "Invalid fileSize." });

        var fileName = (request.FileName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(fileName))
            return FileOperationResult.Invalid(new { message = "fileName is required." });

        var chunkSize = ClampChunkSize(request.ChunkSize);
        var computedTotal = (int)Math.Ceiling((double)request.FileSize / chunkSize);
        var totalChunks = request.TotalChunks.GetValueOrDefault(computedTotal);
        if (totalChunks <= 0) totalChunks = computedTotal;
        if (totalChunks != computedTotal)
            return FileOperationResult.Invalid(new { message = "totalChunks does not match fileSize/chunkSize." });

        var uploadId = Guid.NewGuid().ToString("N");
        await fileStorage.InitializeUploadAsync("rooms", uploadId, actor.CancellationToken);

        var session = new ChunkUploadSession
        {
            UploadId = uploadId,
            RoomId = request.RoomId,
            FileType = (RoomFileType)request.FileType,
            OriginalFileName = fileName,
            Title = ResolveRoomFileTitle(request.Title, fileName),
            Description = NormalizeRoomFileMetadata(request.Description, MaxRoomFileDescriptionLength),
            FileSize = request.FileSize,
            ChunkSize = chunkSize,
            TotalChunks = totalChunks,
            UploadedByUserId = actor.Principal.TryGetLongUserId(out var uid) ? uid.ToString() : null
        };
        sessions.Sessions[uploadId] = session;

        return FileOperationResult.Success(new
        {
            uploadId,
            chunkSize,
            totalChunks,
            fileSize = request.FileSize,
            fileName
        });
    }

    public async Task<FileOperationResult> UploadRoomFileChunk(UploadFileChunkRequest<UploadContent> request)
    {
        await CleanupExpiredChunkSessionsAsync();

        var uploadId = (request.UploadId ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(uploadId))
            return FileOperationResult.Invalid(new { message = "uploadId is required." });
        if (!sessions.Sessions.TryGetValue(uploadId, out var session))
            return FileOperationResult.Missing(new { message = "Upload session not found or expired." });
        if (request.ChunkIndex < 0 || request.ChunkIndex >= session.TotalChunks)
            return FileOperationResult.Invalid(new { message = "chunkIndex is out of range." });
        if (request.Chunk == null || request.Chunk.Length == 0)
            return FileOperationResult.Invalid(new { message = "chunk is required." });
        if (request.Chunk.Length > MaxChunkSizeBytes)
            return FileOperationResult.Invalid(new { message = "chunk size exceeded maximum allowed size." });

        if (!OwnsUpload(session)) return FileOperationResult.Denied();
        var expected = Math.Min(session.ChunkSize, session.FileSize - (long)request.ChunkIndex * session.ChunkSize);
        if (request.Chunk.Length != expected) return FileOperationResult.Invalid(new { message = "Invalid chunk size." });
        await session.Gate.WaitAsync(actor.CancellationToken);
        try
        {
            if (session.Aborted || session.Completed) return FileOperationResult.Conflict(new { message = "Upload session is closed." });
            await using var input = request.Chunk.OpenReadStream();
            await fileStorage.PutChunkAsync("rooms", session.UploadId, request.ChunkIndex, input, expected, session.ChunkSize, session.FileSize, actor.CancellationToken);
            session.ReceivedChunks[request.ChunkIndex] = 1;
            session.Touch();
            return FileOperationResult.Success(new { uploadId, chunkIndex = request.ChunkIndex,
                uploadedChunks = session.ReceivedChunks.Count, totalChunks = session.TotalChunks });
        }
        finally { session.Gate.Release(); }
    }

    public async Task<FileOperationResult> UploadRoomFileComplete(UploadFileCompleteRequest request)
    {
        await CleanupExpiredChunkSessionsAsync();

        var uploadId = (request.UploadId ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(uploadId))
            return FileOperationResult.Invalid(new { message = "uploadId is required." });
        if (!sessions.Sessions.TryGetValue(uploadId, out var session))
            return FileOperationResult.Missing(new { message = "Upload session not found or expired." });

        if (!OwnsUpload(session)) return FileOperationResult.Denied();
        await session.Gate.WaitAsync(actor.CancellationToken);
        try
        {
            if (session.Aborted) return FileOperationResult.Missing(new { message = "Upload session not found or expired." });
            var ext = Path.GetExtension(session.OriginalFileName);
            if (ext.Length > 20 || ext.Any(character => character != '.' && !char.IsAsciiLetterOrDigit(character))) ext = ".bin";
            var relativeUrl = $"/rooms/files/{session.RoomId}/{session.UploadId}{ext}";
            var objectKey = fileStorage.ToObjectKey(relativeUrl, FileAccessTier.Private);
            if (!session.Completed)
            {
                var missing = await fileStorage.GetMissingChunksAsync("rooms", uploadId,
                    session.TotalChunks, session.ChunkSize, session.FileSize, actor.CancellationToken);
                if (missing.Length > 0) return FileOperationResult.Conflict(new { message = "Upload is incomplete.",
                    missingChunkIndexes = missing.Take(20).ToArray(), totalMissing = missing.Length });
                session.Touch();
                await fileStorage.AssembleUploadAsync("rooms", uploadId, objectKey,
                    session.TotalChunks, session.ChunkSize, session.FileSize, actor.CancellationToken);
                var persisted = await commands.Create<AddRoomFileCommand, object>(new AddRoomFileCommand
                {
                    RoomId = session.RoomId, FileType = session.FileType, Title = session.Title,
                    Description = session.Description, FileName = session.OriginalFileName,
                    FileUrl = relativeUrl, FileSize = session.FileSize, UploadedByUserId = session.UploadedByUserId,
                });
                if (persisted.IsFailure)
                {
                    await fileStorage.DeleteAsync(objectKey, CancellationToken.None);
                    return persisted;
                }
                session.Completed = true;
            }
            try
            {
                await fileStorage.DeleteUploadAsync("rooms", uploadId, actor.CancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Saved file, but cleanup of upload {UploadId} failed", uploadId);
            }
            session.Touch();
            return FileOperationResult.Success(new { roomId = session.RoomId, fileName = session.OriginalFileName,
                fileUrl = relativeUrl, fileSize = session.FileSize, fileType = (int)session.FileType });
        }
        finally { session.Gate.Release(); }
    }

    public async Task<FileOperationResult> UploadRoomFileAbort(UploadFileAbortRequest request)
    {
        if (!sessions.Sessions.TryGetValue(request.UploadId.Trim(), out var session)) return FileOperationResult.Success(new { aborted = false });
        if (!OwnsUpload(session)) return FileOperationResult.Denied();
        await session.Gate.WaitAsync(actor.CancellationToken);
        try
        {
            if (session.Completed) return FileOperationResult.Success(new { aborted = false });
            await fileStorage.DeleteUploadAsync("rooms", session.UploadId, actor.CancellationToken);
            session.Aborted = true;
            sessions.Sessions.TryRemove(session.UploadId, out _);
            return FileOperationResult.Success(new { aborted = true });
        }
        finally { session.Gate.Release(); }
    }

    private static string? NormalizeRoomFileMetadata(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static string ResolveRoomFileTitle(string? title, string fileName)
    {
        var normalized = NormalizeRoomFileMetadata(title, MaxRoomFileTitleLength);
        if (!string.IsNullOrWhiteSpace(normalized))
            return normalized;

        var fromFileName = Path.GetFileNameWithoutExtension(fileName.Trim());
        return string.IsNullOrWhiteSpace(fromFileName) ? fileName.Trim() : fromFileName;
    }

    private static int ClampChunkSize(int? desired)
    {
        var size = desired.GetValueOrDefault(DefaultChunkSizeBytes);
        if (size <= 0) size = DefaultChunkSizeBytes;
        return Math.Clamp(size, 256 * 1024, MaxChunkSizeBytes);
    }

    private async Task CleanupExpiredChunkSessionsAsync()
    {
        foreach (var (id, session) in sessions.Sessions)
        {
            if (!session.IsExpired(DateTime.UtcNow) || !await session.Gate.WaitAsync(0)) continue;
            try
            {
                if (!session.IsExpired(DateTime.UtcNow)) continue;
                await fileStorage.DeleteUploadAsync("rooms", id, actor.CancellationToken);
                session.Aborted = true;
                sessions.Sessions.TryRemove(id, out _);
            }
            finally { session.Gate.Release(); }
        }
    }

    private void TryDeleteRoomPhysicalFile(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl)) return;
        var path = relativeUrl.Trim();
        if (path.StartsWith("/rooms/files/", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("private/rooms/files/", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/private/rooms/files/", StringComparison.OrdinalIgnoreCase))
            legacyFiles.Delete(path);
    }

    private static string? ExtractFileUrl(object? data)
    {
        if (data == null)
            return null;

        var type = data.GetType();
        return type.GetProperty("fileUrl")?.GetValue(data)?.ToString()
            ?? type.GetProperty("FileUrl")?.GetValue(data)?.ToString();
    }

    private bool OwnsUpload(ChunkUploadSession session) => actor.Principal.IsDashboardAdminRole() ||
        (actor.Principal.TryGetLongUserId(out var current) && session.UploadedByUserId == current.ToString());
}
