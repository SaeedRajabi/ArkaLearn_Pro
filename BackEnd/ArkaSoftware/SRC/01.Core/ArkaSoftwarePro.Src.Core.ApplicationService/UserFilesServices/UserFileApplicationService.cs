using Microsoft.Extensions.Logging;
using ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Queries.GetUserFiles;
using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;
using ArkaSoftwarePro.Src.Core.ApplicationService.Common;
using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.Uploads;
using ArkaSoftwarePro.Src.Core.Contracts.UserFiles;
using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Common;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Uploads;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices;

public sealed class UserFileApplicationService(
    IUserFileReadRepository files,
    ManagedRoomStudentAccessService studentAccess,
    UserFileNotifier userFileNotifier,
    IRemoteUploadStorage fileStorage,
    ILegacyFileStore legacyFiles,
    IMemoryCache storageUsageCache,
    UserFileUploadSessionStore sessions,
    ILogger<UserFileApplicationService> logger,
    ICurrentActor actor,
    ApplicationCommandExecutor commands)
{
    private const long MaxFileSizeBytes = FileUploadLimits.StudentFileSize;
    private const int DefaultChunkSizeBytes = FileUploadLimits.DefaultChunkSize;
    private const int MaxChunkSizeBytes = FileUploadLimits.MaxChunkSize;
    public async Task<FileOperationResult> CreateFolder(CreateUserFolderCommand command)
    {
        if (!await CanManageUserFilesAsync(command.UserId))
            return FileOperationResult.Denied();

        command.UserId = await files.ResolveWriteOwnerIdAsync(command.UserId, command.ParentId);
        command.UploadedByUserId = ResolveCurrentPortalUserId();
        return await commands.Create<CreateUserFolderCommand, long>(command);
    }

    public async Task<FileOperationResult> Rename(RenameUserFileCommand command)
    {
        if (!await CanManageUserFilesAsync(command.UserId))
            return FileOperationResult.Denied();

        var ownerId = await files.ResolveExistingFileOwnerIdAsync(command.FileId, command.UserId);
        if (ownerId is null)
            return FileOperationResult.Missing(new { message = "File not found." });

        command.UserId = ownerId.Value;
        return await commands.Edit<RenameUserFileCommand, string>(command);
    }

    public async Task<FileOperationResult> Delete(
        long? fileId,
        long? userId,
        DeleteUserFileCommand? command)
    {
        var resolvedFileId = fileId ?? command?.FileId ?? 0;
        var requestedUserId = userId ?? command?.UserId ?? 0;

        if (!await CanManageUserFilesAsync(requestedUserId))
            return FileOperationResult.Denied();

        var resolvedUserId = await files.ResolveExistingFileOwnerIdAsync(resolvedFileId, requestedUserId);
        if (resolvedUserId is null)
            return FileOperationResult.Missing(new { message = "File not found." });

        var allFiles = await files.GetOwnerFilesAsync(resolvedUserId.Value);

        var idsToDelete = CollectSubtreeIds(resolvedFileId, allFiles);
        var physicalUrls = allFiles
            .Where(x => idsToDelete.Contains(x.Id) && !x.IsFolder && !string.IsNullOrWhiteSpace(x.FileUrl))
            .Select(x => x.FileUrl!)
            .ToList();

        try
        {
            foreach (var url in physicalUrls)
            {
                var uploadId = Path.GetFileNameWithoutExtension(url);
                sessions.Sessions.TryGetValue(uploadId, out var active);
                if (active != null) await active.Gate.WaitAsync(actor.CancellationToken);
                try
                {
                    await fileStorage.DeleteAsync(fileStorage.ToObjectKey(url, FileAccessTier.Private), actor.CancellationToken);
                    if (Guid.TryParseExact(uploadId, "N", out _))
                    {
                        await fileStorage.DeleteUploadAsync("users", uploadId, actor.CancellationToken);
                        if (sessions.Sessions.TryRemove(uploadId, out var completed)) completed.Aborted = true;
                    }
                }
                finally { active?.Gate.Release(); }
            }
            foreach (var session in sessions.Sessions.Values.Where(session => session.UserId == resolvedUserId.Value &&
                session.ParentId.HasValue && idsToDelete.Contains(session.ParentId.Value)))
            {
                await session.Gate.WaitAsync(actor.CancellationToken);
                try
                {
                    if (session.Completed)
                    {
                        var completedUrl = GetUploadRelativeUrl(session);
                        await fileStorage.DeleteAsync(fileStorage.ToObjectKey(completedUrl, FileAccessTier.Private), actor.CancellationToken);
                    }
                    await fileStorage.DeleteUploadAsync("users", session.UploadId, actor.CancellationToken);
                    session.Aborted = true;
                    sessions.Sessions.TryRemove(session.UploadId, out _);
                }
                finally { session.Gate.Release(); }
            }
        }
        catch (OperationCanceledException) when (actor.CancellationToken.IsCancellationRequested) { throw; }
        catch { return FileOperationResult.StorageFailure(new { message = "Files could not be fully removed from the download host. Please retry." }); }
        var result = await commands.Edit<DeleteUserFileCommand, string>(
            new DeleteUserFileCommand { FileId = resolvedFileId, UserId = resolvedUserId.Value });
        if (result.Kind == FileOperationOutcome.Success)
        {
            foreach (var url in physicalUrls) legacyFiles.Delete(url);
            storageUsageCache.Remove(StorageUsageCacheKey);
        }

        return result;
    }

    private static HashSet<long> CollectSubtreeIds(long rootId, List<UserFileSnapshot> allFiles)
    {
        var ids = new HashSet<long> { rootId };
        var changed = true;
        while (changed)
        {
            changed = false;
            foreach (var file in allFiles)
            {
                if (file.ParentId.HasValue && ids.Contains(file.ParentId.Value) && ids.Add(file.Id))
                    changed = true;
            }
        }

        return ids;
    }

    public async Task<FileOperationResult> GetFiles(GetUserFilesQuery query)
    {
        if (!await CanManageUserFilesAsync(query.UserId))
            return FileOperationResult.Denied();

        // Same path as GetMyFiles: query DB directly.
        // Avoids CQRS cache (Redis) and any stale UploadedByUserId mapping issues on full-entity loads.
        var ownerIds = await files.ResolveRelatedFileOwnerIdsAsync(query.UserId);
        if (ownerIds.Count == 0 && query.UserId > 0)
            ownerIds.Add(query.UserId);


        var items = await files.GetFilesAsync(ownerIds, query.ParentId);

        return FileOperationResult.Success(items);
    }

    public async Task<FileOperationResult> GetMyFiles(long? parentId)
    {
        var userIds = await ResolveCurrentUserFileOwnerIdsAsync();
        if (userIds.Count == 0)
            return FileOperationResult.Unauthenticated();


        var items = await files.GetFilesAsync(userIds, parentId);

        return FileOperationResult.Success(items);
    }

    /// <summary>Authenticated download with HTTP Range support for resumable transfers.</summary>
    public async Task<FileOperationResult> Download(long fileId)
    {
        if (fileId <= 0)
            return FileOperationResult.Invalid(new { message = "fileId is required." });

        var file = await files.GetFileAsync(fileId);

        if (file is null || file.IsFolder || string.IsNullOrWhiteSpace(file.FileUrl))
            return FileOperationResult.Missing(new { message = "File not found." });

        if (!await CanDownloadUserFileAsync(file.UserId))
            return FileOperationResult.Denied();

        return await ServeUserFileAsync(file.FileUrl, file.Name);
    }

    /// <summary>
    /// Called by the student client after a download finishes (not on each Range request).
    /// </summary>
    public async Task<FileOperationResult> NotifyDownloadCompleted(NotifyDownloadCompletedRequest? request)
    {
        if (request is null || request.FileId <= 0)
            return FileOperationResult.Invalid(new { message = "fileId is required." });

        // Teachers/admins browsing student files should not trigger "student downloaded" alerts.
        if (actor.Principal.IsDashboardAdminRole() || actor.Principal.IsStaffProfessorRole())
            return FileOperationResult.Success(new { notified = false });

        var file = await files.GetFileAsync(request.FileId);

        if (file is null || file.IsFolder)
            return FileOperationResult.Missing(new { message = "File not found." });

        if (!await CanDownloadUserFileAsync(file.UserId))
            return FileOperationResult.Denied();

        var ownerIds = await ResolveCurrentUserFileOwnerIdsAsync();
        if (!ownerIds.Contains(file.UserId))
            return FileOperationResult.Success(new { notified = false });

        var managedStudentId = await files.ResolveManagedStudentIdForFileOwnerAsync(file.UserId);
        if (managedStudentId is null or <= 0)
            return FileOperationResult.Success(new { notified = false });

        string? studentDisplayName = null;
        if (actor.Principal.TryGetLongUserId(out var currentUserId) && currentUserId > 0)
        {
            var me = await files.GetPortalIdentityAsync(currentUserId);
            if (me is not null)
            {
                studentDisplayName = $"{me.FirstName} {me.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(studentDisplayName))
                    studentDisplayName = me.UserName;
            }
        }

        await userFileNotifier.NotifySharedFileDownloadedAsync(
            managedStudentId.Value,
            file.Name,
            file.Id,
            studentDisplayName,
            file.UploadedByUserId);

        return FileOperationResult.Success(new { notified = true });
    }

    public async Task<FileOperationResult> UploadFile(
        long userId,
        long? parentId,
        UploadContent? file)
    {
        if (file == null || file.Length == 0)
            return FileOperationResult.Invalid(new { message = "No file uploaded." });
        if (file.Length > MaxChunkSizeBytes)
            return FileOperationResult.Invalid(new { message = "Files above 8 MB must use resumable upload." });

        if (!await CanManageUserFilesAsync(userId))
            return FileOperationResult.Denied();

        userId = await files.ResolveWriteOwnerIdAsync(userId, parentId);

        var displayName = (file.FileName ?? string.Empty).Trim();
        if (await files.SiblingNameExistsAsync(userId, parentId is > 0 ? parentId : null, displayName))
            return FileOperationResult.Conflict(new { message = "A folder or file with this name already exists in this location." });

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext)) ext = ".bin";
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var relativeUrl = "/users/files/" + userId + "/" + fileName;
        var objectKey = $"users/files/{userId}/{fileName}";
        var contentType = string.IsNullOrWhiteSpace(file.ContentType)
            ? "application/octet-stream"
            : file.ContentType;

        try
        {
            await using var stream = file.OpenReadStream();
            var stored = await fileStorage.PutAsync(
                objectKey,
                stream,
                contentType,
                FileAccessTier.Private);

            if (!await fileStorage.ExistsAsync(stored.ObjectKey))
            {
                return FileOperationResult.StorageFailure(new
                {
                    message = "Upload to download host failed verification. File is not on the FTP server.",
                    objectKey = stored.ObjectKey,
                    hint = "Check FileStorage FTP settings and look under private/users/files on the download host."
                });
            }
        }
        catch (Exception ex)
        {
            return FileOperationResult.StorageFailure(new
            {
                message = "Failed to upload file to download host via FTP.",
                detail = ex.Message,
                objectKey,
                hint = "Student files are stored under private/users/files/{userId}/ on msg (not public/)."
            });
        }

        var command = new SaveUserFileCommand
        {
            UserId = userId,
            ParentId = parentId,
            Name = file.FileName,
            FileUrl = relativeUrl,
            FileSize = file.Length,
            NotifyStudent = await ShouldNotifyStudentAboutSharedFileAsync(userId),
            UploadedByUserId = ResolveCurrentPortalUserId(),
        };

        var result = await commands.Create<SaveUserFileCommand, long>(command);
        if (result.IsFailure)
            await fileStorage.DeleteAsync(fileStorage.ToObjectKey(relativeUrl, FileAccessTier.Private));
        storageUsageCache.Remove(StorageUsageCacheKey);
        return result;
    }

    /// <summary>Initialize a resumable upload whose bytes stay on the download host.</summary>
    public async Task<FileOperationResult> UploadFileInit(UploadFileInitRequest request)
    {
        await CleanupExpiredChunkSessionsAsync();
        if (request.UserId <= 0 || request.FileSize <= 0 || request.FileSize > MaxFileSizeBytes)
            return FileOperationResult.Invalid(new { message = "Invalid userId or fileSize." });
        if (!await CanManageUserFilesAsync(request.UserId)) return FileOperationResult.Denied();
        var fileName = request.FileName.Trim();
        if (string.IsNullOrWhiteSpace(fileName) || fileName.Length > 255)
            return FileOperationResult.Invalid(new { message = "A file name of at most 255 characters is required." });
        var owner = await files.ResolveWriteOwnerIdAsync(request.UserId, request.ParentId);
        var parent = request.ParentId is > 0 ? request.ParentId : null;
        if (await files.SiblingNameExistsAsync(owner, parent, fileName))
            return FileOperationResult.Conflict(new { message = "A folder or file with this name already exists in this location." });
        var size = ClampChunkSize(request.ChunkSize);
        var count = (int)((request.FileSize + size - 1) / size);
        if (request.TotalChunks.HasValue && request.TotalChunks.Value != count)
            return FileOperationResult.Invalid(new { message = "totalChunks does not match fileSize/chunkSize." });
        var uploadId = Guid.NewGuid().ToString("N");
        await fileStorage.InitializeUploadAsync("users", uploadId, actor.CancellationToken);
        sessions.Sessions[uploadId] = new UserFileChunkUploadSession
        {
            UploadId = uploadId, UserId = owner, ParentId = parent,
            OriginalFileName = fileName, FileSize = request.FileSize,
            ChunkSize = size, TotalChunks = count,
        };
        storageUsageCache.Remove(StorageUsageCacheKey);
        return FileOperationResult.Success(new { uploadId, chunkSize = size, totalChunks = count, fileSize = request.FileSize, fileName });
    }

    public async Task<FileOperationResult> UploadFileChunk(UploadFileChunkRequest<UploadContent> request)
    {
        if (!sessions.Sessions.TryGetValue(request.UploadId.Trim(), out var session) || session.IsExpired(DateTime.UtcNow))
            return FileOperationResult.Missing(new { message = "Upload session not found or expired." });
        if (!await CanManageUserFilesAsync(session.UserId)) return FileOperationResult.Denied();
        if (request.ChunkIndex < 0 || request.ChunkIndex >= session.TotalChunks)
            return FileOperationResult.Invalid(new { message = "chunkIndex is out of range." });
        var expected = Math.Min(session.ChunkSize, session.FileSize - (long)request.ChunkIndex * session.ChunkSize);
        if (request.Chunk is null || request.Chunk.Length != expected)
            return FileOperationResult.Invalid(new { message = "Chunk size does not match its declared position." });
        await session.Gate.WaitAsync(actor.CancellationToken);
        try
        {
            if (session.Aborted || session.Completed) return FileOperationResult.Conflict(new { message = "Upload session is closed." });
            await using var input = request.Chunk.OpenReadStream();
            await fileStorage.PutChunkAsync("users", session.UploadId, request.ChunkIndex, input, expected, session.ChunkSize, session.FileSize, actor.CancellationToken);
            session.ReceivedChunks[request.ChunkIndex] = 1;
            session.Touch();
            storageUsageCache.Remove(StorageUsageCacheKey);
            return FileOperationResult.Success(new { uploadId = session.UploadId, chunkIndex = request.ChunkIndex,
                uploadedChunks = session.ReceivedChunks.Count, totalChunks = session.TotalChunks });
        }
        finally { session.Gate.Release(); }
    }

    public async Task<FileOperationResult> UploadFileComplete(UploadFileCompleteRequest request)
    {
        if (!sessions.Sessions.TryGetValue(request.UploadId.Trim(), out var session) || session.IsExpired(DateTime.UtcNow))
            return FileOperationResult.Missing(new { message = "Upload session not found or expired." });
        if (!await CanManageUserFilesAsync(session.UserId)) return FileOperationResult.Denied();
        await session.Gate.WaitAsync(actor.CancellationToken);
        try
        {
            if (session.Aborted) return FileOperationResult.Missing(new { message = "Upload session not found or expired." });
            var relativeUrl = GetUploadRelativeUrl(session);
            var objectKey = fileStorage.ToObjectKey(relativeUrl, FileAccessTier.Private);
            var saved = session.Completed || await files.HasFileUrlAsync(session.UserId, relativeUrl);
            if (!saved)
            {
                var missing = await fileStorage.GetMissingChunksAsync("users", session.UploadId,
                    session.TotalChunks, session.ChunkSize, session.FileSize, actor.CancellationToken);
                if (missing.Length > 0)
                    return FileOperationResult.Conflict(new { message = "Upload is incomplete.", missingChunkIndexes = missing,
                        totalMissing = missing.Length });
                session.Touch();
                await fileStorage.AssembleUploadAsync("users", session.UploadId, objectKey,
                    session.TotalChunks, session.ChunkSize, session.FileSize, actor.CancellationToken);
                var result = await commands.Create<SaveUserFileCommand, long>(new SaveUserFileCommand
                {
                    UserId = session.UserId, ParentId = session.ParentId, Name = session.OriginalFileName,
                    FileUrl = relativeUrl, FileSize = session.FileSize,
                    NotifyStudent = await ShouldNotifyStudentAboutSharedFileAsync(session.UserId),
                    UploadedByUserId = ResolveCurrentPortalUserId(),
                });
                if (result.IsFailure)
                {
                    await fileStorage.DeleteAsync(objectKey, CancellationToken.None);
                    return result;
                }
            }
            session.Completed = true;
            try
            {
                await fileStorage.DeleteUploadAsync("users", session.UploadId, actor.CancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Saved file, but cleanup of upload {UploadId} failed", session.UploadId);
            }
            session.Touch();
            storageUsageCache.Remove(StorageUsageCacheKey);
            return FileOperationResult.Success(new { userId = session.UserId, name = session.OriginalFileName,
                fileUrl = relativeUrl, fileSize = session.FileSize });
        }
        finally { session.Gate.Release(); }
    }

    public async Task<FileOperationResult> UploadFileAbort(UploadFileAbortRequest request)
    {
        if (!sessions.Sessions.TryGetValue(request.UploadId.Trim(), out var session)) return FileOperationResult.Success(new { aborted = false });
        if (!await CanManageUserFilesAsync(session.UserId)) return FileOperationResult.Denied();
        await session.Gate.WaitAsync(actor.CancellationToken);
        try
        {
            if (session.Completed) return FileOperationResult.Success(new { aborted = false });
            await fileStorage.DeleteUploadAsync("users", session.UploadId, actor.CancellationToken);
            session.Aborted = true;
            sessions.Sessions.TryRemove(session.UploadId, out _);
            storageUsageCache.Remove(StorageUsageCacheKey);
            return FileOperationResult.Success(new { aborted = true });
        }
        finally { session.Gate.Release(); }
    }

    private const string StorageUsageCacheKey = "download-host-storage-usage";


    public async Task<FileOperationResult> GetStorageUsage()
    {
        if (!actor.Principal.IsDashboardAdminRole()) return FileOperationResult.Denied();
        await sessions.UsageGate.WaitAsync(actor.CancellationToken);
        try
        {
            if (!storageUsageCache.TryGetValue(StorageUsageCacheKey, out DownloadStorageUsage? usage))
            {
                usage = await fileStorage.GetUsageAsync(actor.CancellationToken);
                storageUsageCache.Set(StorageUsageCacheKey, usage, TimeSpan.FromSeconds(15));
            }
            return FileOperationResult.Success(usage);
        }
        catch (OperationCanceledException) when (actor.CancellationToken.IsCancellationRequested) { throw; }
        catch { return FileOperationResult.StorageFailure(new { message = "Download-host storage usage is temporarily unavailable." }); }
        finally { sessions.UsageGate.Release(); }
    }


    private static string GetUploadRelativeUrl(UserFileChunkUploadSession session)
    {
        var extension = Path.GetExtension(session.OriginalFileName);
        if (extension.Length > 20 || extension.Any(character => character != '.' && !char.IsAsciiLetterOrDigit(character)))
            extension = ".bin";
        return $"/users/files/{session.UserId}/{session.UploadId}{extension}";
    }

    private long? ResolveCurrentPortalUserId() => actor.Principal.TryGetLongUserId(out var id) && id > 0 ? id : null;
    private static int ClampChunkSize(int? desired) => Math.Clamp(desired is > 0 ? desired.Value : DefaultChunkSizeBytes, 256 * 1024, MaxChunkSizeBytes);

    private async Task CleanupExpiredChunkSessionsAsync()
    {
        foreach (var (id, session) in sessions.Sessions)
        {
            if (!session.IsExpired(DateTime.UtcNow) || !await session.Gate.WaitAsync(0)) continue;
            try
            {
                if (!session.IsExpired(DateTime.UtcNow)) continue;
                await fileStorage.DeleteUploadAsync("users", id, actor.CancellationToken);
                session.Aborted = true;
                sessions.Sessions.TryRemove(id, out _);
            }
            finally { session.Gate.Release(); }
        }
    }

    private async Task<List<long>> ResolveCurrentUserFileOwnerIdsAsync()
    {
        var ids = new List<long>();

        if (actor.Principal.TryGetLongUserId(out var userId))
            ids.Add(userId);

        var userName = actor.Principal.FindFirst(ClaimTypes.Name)?.Value?.Trim();
        var email = actor.Principal.FindFirst(ClaimTypes.Email)?.Value?.Trim();

        if (!string.IsNullOrWhiteSpace(userName) || !string.IsNullOrWhiteSpace(email))
        {
            var managedStudentIds = await files.FindManagedOwnerIdsAsync(userName, email);

            ids.AddRange(managedStudentIds);
        }

        return ids.Distinct().ToList();
    }

    /// <summary>
    /// Portal actor.Principal.Id and ManagedRoomStudent.Id for the same person must share one file tree.
    /// </summary>








    private async Task<bool> ShouldNotifyStudentAboutSharedFileAsync(long managedStudentId)
    {
        if (managedStudentId <= 0)
            return false;

        if (actor.Principal.IsDashboardAdminRole() || actor.Principal.IsStaffProfessorRole())
            return true;

        return actor.Principal.TryGetLongUserId(out _) &&
               await studentAccess.CanManageAsync(actor.Principal, managedStudentId);
    }



    private async Task<bool> CanDownloadUserFileAsync(long fileOwnerUserId)
    {
        if (fileOwnerUserId <= 0)
            return false;

        if (actor.Principal.IsDashboardAdminRole())
            return true;

        var ownerIds = await ResolveCurrentUserFileOwnerIdsAsync();
        if (ownerIds.Contains(fileOwnerUserId))
            return true;

        var related = await files.ResolveRelatedFileOwnerIdsAsync(fileOwnerUserId);
        return related.Any(id => ownerIds.Contains(id));
    }



    private async Task<FileOperationResult> ServeUserFileAsync(string fileUrl, string? downloadName)
    {
        var objectKey = fileStorage.ToObjectKey(fileUrl, FileAccessTier.Private);
        var safeName = string.IsNullOrWhiteSpace(downloadName)
            ? Path.GetFileName(fileUrl.Trim().Replace('\\', '/'))
            : Path.GetFileName(downloadName.Trim());
        if (string.IsNullOrWhiteSpace(safeName))
            safeName = "download.bin";

        // Stream from FTP/download host through this authenticated API response.
        // Do NOT redirect to SignedRead — browser fetch via Next proxy hits CORS ("Failed to fetch").
        var remote = await fileStorage.OpenReadAsync(objectKey);
        if (remote is not null)
        {
            var contentType = GuessUserFileContentType(safeName);
            return FileOperationResult.Download(remote, contentType, safeName);
        }

        var legacy = legacyFiles.OpenRead(fileUrl);
        return legacy is null
            ? FileOperationResult.Missing(new { message = "Physical file not found." })
            : FileOperationResult.Download(legacy, GuessUserFileContentType(safeName), safeName);
    }

    private static string GuessUserFileContentType(string pathOrName)
    {
        var ext = Path.GetExtension(pathOrName).ToLowerInvariant();
        return ext switch
        {
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".mkv" => "video/x-matroska",
            ".pdf" => "application/pdf",
            ".zip" => "application/zip",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".txt" => "text/plain",
            _ => "application/octet-stream",
        };
    }

    private async Task<bool> CanManageUserFilesAsync(long targetUserId)
    {
        if (targetUserId <= 0)
            return false;

        if (actor.Principal.IsDashboardAdminRole())
            return true;

        if (actor.Principal.TryGetLongUserId(out var currentUserId) && currentUserId == targetUserId)
            return true;

        var ownerIds = await ResolveCurrentUserFileOwnerIdsAsync();
        if (ownerIds.Contains(targetUserId))
            return true;

        if (await studentAccess.CanManageAsync(actor.Principal, targetUserId))
            return true;

        var related = await files.ResolveRelatedFileOwnerIdsAsync(targetUserId);
        foreach (var id in related)
        {
            if (id == targetUserId)
                continue;
            if (ownerIds.Contains(id))
                return true;
            if (await studentAccess.CanManageAsync(actor.Principal, id))
                return true;
        }

        return false;
    }
}
