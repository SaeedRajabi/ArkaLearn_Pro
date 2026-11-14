using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;
using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.FileStorage;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

/// <summary>
/// Streams private/drm objects from FTP storage using short-lived HMAC signed query params.
/// Public objects should be fetched directly from msg static hosting.
/// </summary>
[Route("api/Service/[controller]")]
public sealed class FileStorageController(
    IFileStorage fileStorage,
    IOptions<FileStorageOptions> options) : BaseController
{
    [AllowAnonymous]
    [HttpGet("SignedRead")]
    public async Task<IActionResult> SignedRead(
        [FromQuery] string key,
        [FromQuery] long exp,
        [FromQuery] string sig,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(sig) || exp <= 0)
            return BadRequest("key, exp and sig are required.");

        var objectKey = key.Replace('\\', '/').Trim().TrimStart('/');
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (exp < now)
            return Unauthorized("Signed URL expired.");

        var expected = FileStorageKeyHelper.CreateHmacSignature(objectKey, exp, options.Value.SigningKey);
        if (!FixedTimeEquals(expected, sig.Trim()))
            return Unauthorized("Invalid signature.");

        if (objectKey.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
        {
            var publicUrl = fileStorage.GetPublicUrl(objectKey);
            return Redirect(publicUrl);
        }

        var stream = await fileStorage.OpenReadAsync(objectKey, cancellationToken);
        if (stream is null)
            return NotFound();

        var contentType = GuessContentType(objectKey);
        return File(stream, contentType, enableRangeProcessing: false);
    }

    private static bool FixedTimeEquals(string a, string b)
    {
        var ba = System.Text.Encoding.UTF8.GetBytes(a.ToLowerInvariant());
        var bb = System.Text.Encoding.UTF8.GetBytes(b.ToLowerInvariant());
        if (ba.Length != bb.Length) return false;
        return System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(ba, bb);
    }

    private static string GuessContentType(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".pdf" => "application/pdf",
            ".arka" => "application/octet-stream",
            _ => "application/octet-stream",
        };
    }
}
