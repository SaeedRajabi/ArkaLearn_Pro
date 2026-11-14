using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.DeleteMediaAsset;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.DismissMediaRejection;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.RejectMediaAsset;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.EncryptMediaAsset;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.SaveMediaAsset;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.UpdateMediaAssetMetadata;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Queries.GetMediaAssetOwners;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Queries.GetMediaAssets;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class MediaController(IWebHostEnvironment env, IFileStorage fileStorage) : BaseController
{
    private const long MaxUploadBytes = 3L * 1024 * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg",
        ".mp4", ".webm", ".mov", ".avi",
        ".doc", ".docx", ".xls", ".xlsx", ".pdf",
        ".zip", ".rar", ".7z", ".exe", ".msi", ".dmg", ".pkg", ".deb", ".rpm", ".apk",
    };

    [HttpGet("List")]
    public async Task<IActionResult> List(
        [FromQuery] long? ownerUserId,
        [FromQuery] int? mediaType,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        var query = new GetMediaAssetsQuery
        {
            RequestingUserId = userId,
            IsAdmin = IsAdminUser(),
            OwnerUserId = ownerUserId is > 0 ? ownerUserId : null,
            MediaType = mediaType,
            Search = search,
            Page = page,
            PageSize = pageSize,
        };
        return await Query<GetMediaAssetsQuery, PagedMediaAssetsQri>(query);
    }

    [HttpGet("ListOwners")]
    public async Task<IActionResult> ListOwners(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        if (!IsAdminUser()) return Forbid();

        var query = new GetMediaAssetOwnersQuery
        {
            RequestingUserId = userId,
            IsAdmin = true,
            Search = search,
            Page = page,
            PageSize = pageSize,
        };
        return await Query<GetMediaAssetOwnersQuery, PagedMediaAssetOwnersQri>(query);
    }

    [HttpPost("Upload")]
    [RequestSizeLimit(MaxUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadBytes)]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file,
        [FromForm] long? ownerUserId,
        [FromForm] string? title,
        [FromForm] string? altText,
        [FromForm] string? caption,
        [FromForm] string? description,
        [FromForm] bool encryptForDesktop = false,
        [FromForm] string? preferredFileName = null)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        if (file == null || file.Length <= 0) return BadRequest("File is required.");
        if (file.Length > MaxUploadBytes) return BadRequest("File is too large.");
        if (!IsAllowedUpload(file))
            return BadRequest("File type is not allowed. Allowed: images, videos, Word, Excel, ZIP, RAR.");

        var isAdmin = IsAdminUser();
        var targetOwnerId = isAdmin && ownerUserId.HasValue && ownerUserId.Value > 0
            ? ownerUserId.Value
            : userId;

        if (!isAdmin && targetOwnerId != userId)
            return Forbid();

        var mediaType = ResolveMediaType(file.ContentType, file.FileName);
        string relativeUrl;
        string? physicalPathForEncrypt = null;
        var webRoot = env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
            webRoot = Path.Combine(env.ContentRootPath, "wwwroot");

        try
        {
            if (encryptForDesktop && (mediaType == MediaType.Video || mediaType == MediaType.Document))
            {
                // Encrypt pipeline needs a local temp file; DRM object is written to msg afterward.
                var saved = await SaveLocalTempAsync(file, targetOwnerId, preferredFileName, webRoot);
                if (saved is null)
                    return BadRequest("Could not save file.");
                relativeUrl = saved.Value.RelativeUrl;
                physicalPathForEncrypt = saved.Value.PhysicalPath;
            }
            else
            {
                var stored = await SaveUploadToStorageAsync(file, targetOwnerId, preferredFileName);
                if (stored is null)
                    return BadRequest("Could not save file.");
                relativeUrl = stored;
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new[] { "Media upload failed.", ex.InnerException?.Message ?? ex.Message });
        }

        var command = new SaveMediaAssetCommand
        {
            OwnerUserId = targetOwnerId,
            FileUrl = relativeUrl,
            OriginalFileName = !string.IsNullOrWhiteSpace(preferredFileName)
                ? Path.GetFileName(preferredFileName.Trim())
                : file.FileName,
            MimeType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileSizeBytes = file.Length,
            MediaType = mediaType,
            Title = title,
            AltText = altText,
            Caption = caption,
            Description = description,
        };

        try
        {
            var createResult = await CommandDispatcher.Send<SaveMediaAssetCommand, long>(command);
            if (createResult.Status != Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok)
                return BadRequest(createResult.Messages);

            var mediaId = createResult.Data;
            var fileUrl = relativeUrl;

            if (encryptForDesktop
                && (mediaType == MediaType.Video || mediaType == MediaType.Document)
                && !string.IsNullOrWhiteSpace(physicalPathForEncrypt))
            {
                var encryptResult = await CommandDispatcher.Send<EncryptMediaAssetCommand, string>(
                    new EncryptMediaAssetCommand
                    {
                        MediaAssetId = mediaId,
                        PhysicalFilePath = physicalPathForEncrypt,
                        WebRootPath = webRoot,
                    });

                if (encryptResult.Status != Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok)
                    return BadRequest(encryptResult.Messages);

                if (!string.IsNullOrWhiteSpace(encryptResult.Data))
                    fileUrl = encryptResult.Data;
            }

            return StatusCode((int)System.Net.HttpStatusCode.Created, new { id = mediaId, fileUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new[]
            {
                "Media upload failed. Ensure database migrations are applied (Media.MediaAssets table).",
                ex.InnerException?.Message ?? ex.Message,
            });
        }
    }

    [HttpPut("UpdateMetadata")]
    [HttpPost("UpdateMetadata")]
    public async Task<IActionResult> UpdateMetadata([FromBody] UpdateMediaAssetMetadataCommand command)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        command.RequestingUserId = userId;
        command.IsAdmin = IsAdminUser();
        return await Edit<UpdateMediaAssetMetadataCommand, string>(command);
    }

    [HttpPost("Reject")]
    public async Task<IActionResult> Reject([FromBody] RejectMediaAssetCommand command)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        if (!IsAdminUser()) return Forbid();
        command.RequestingUserId = userId;
        command.IsAdmin = true;
        return await Edit<RejectMediaAssetCommand, string>(command);
    }

    [HttpPost("DismissRejection")]
    public async Task<IActionResult> DismissRejection([FromBody] DismissMediaRejectionCommand command)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        command.RequestingUserId = userId;
        return await Edit<DismissMediaRejectionCommand, string>(command);
    }

    [HttpDelete("Delete")]
    public async Task<IActionResult> Delete([FromQuery] long id)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        var command = new DeleteMediaAssetCommand
        {
            Id = id,
            RequestingUserId = userId,
            IsAdmin = IsAdminUser(),
        };
        return await Edit<DeleteMediaAssetCommand, string>(command);
    }

    private bool IsAllowedUpload(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext)) return false;
        return AllowedExtensions.Contains(ext);
    }

    private async Task<string?> SaveUploadToStorageAsync(IFormFile file, long ownerUserId, string? preferredFileName = null)
    {
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = Path.GetExtension(preferredFileName ?? string.Empty);
        if (string.IsNullOrWhiteSpace(ext))
            ext = ".bin";

        var fileName = BuildStoredFileName(preferredFileName, ext);
        var objectKey = $"media/{ownerUserId}/{fileName}";
        await using var stream = file.OpenReadStream();
        var stored = await fileStorage.PutAsync(
            objectKey,
            stream,
            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileAccessTier.Public);

        return ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver.ToDbStoredPath(stored);
    }

    private async Task<(string RelativeUrl, string PhysicalPath)?> SaveLocalTempAsync(
        IFormFile file,
        long ownerUserId,
        string? preferredFileName,
        string webRoot)
    {
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = Path.GetExtension(preferredFileName ?? string.Empty);
        if (string.IsNullOrWhiteSpace(ext))
            ext = ".bin";

        var fileName = BuildStoredFileName(preferredFileName, ext);
        var dir = Path.Combine(webRoot, "media", ownerUserId.ToString());
        Directory.CreateDirectory(dir);
        var fullPath = Path.Combine(dir, fileName);
        if (System.IO.File.Exists(fullPath))
        {
            var baseName = Path.GetFileNameWithoutExtension(fileName);
            fileName = $"{baseName}-{Guid.NewGuid():N}{ext}";
            fullPath = Path.Combine(dir, fileName);
        }

        await using (var stream = new FileStream(fullPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var relativeUrl = $"/media/{ownerUserId}/{fileName}".Replace("\\", "/");
        return (relativeUrl, fullPath);
    }

    private static string BuildStoredFileName(string? preferredFileName, string ext)
    {
        if (!string.IsNullOrWhiteSpace(preferredFileName))
        {
            var safe = Path.GetFileName(preferredFileName.Trim());
            foreach (var c in Path.GetInvalidFileNameChars())
                safe = safe.Replace(c, '_');
            safe = safe.Trim('.', ' ');
            if (!string.IsNullOrWhiteSpace(safe))
            {
                if (string.IsNullOrWhiteSpace(Path.GetExtension(safe)))
                    safe += ext;
                return safe;
            }
        }

        return $"{Guid.NewGuid():N}{ext}";
    }

    private static MediaType ResolveMediaType(string? mimeType, string fileName)
    {
        var mime = mimeType?.ToLowerInvariant() ?? string.Empty;
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (mime.StartsWith("image/") || ext is ".jpg" or ".jpeg" or ".png" or ".webp" or ".gif" or ".svg")
            return MediaType.Image;
        if (mime.StartsWith("video/") || ext is ".mp4" or ".webm" or ".mov" or ".avi")
            return MediaType.Video;
        if (ext is ".doc" or ".docx" or ".xls" or ".xlsx")
            return MediaType.Document;
        if (ext is ".zip" or ".rar" or ".7z" or ".exe" or ".msi" or ".dmg" or ".pkg" or ".deb" or ".rpm" or ".apk")
            return MediaType.Other;
        return MediaType.Other;
    }

    private long GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("userId")?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("UserId")?.Value;
        return long.TryParse(claim, out var id) ? id : 0;
    }

    private bool IsAdminUser() => User.IsDashboardAdminRole();
}
