using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.DeleteSoftware;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.RecordSoftwareDownload;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.SavePlatformSoftware;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.SaveTeacherSoftware;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.ToggleSoftwareLike;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetMySoftware;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetSoftwareBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.SearchSoftware;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class SoftwareController(FileStoragePathSaver pathSaver) : BaseController
{
    private const long MaxCoverBytes = 5 * 1024 * 1024;
    private const long MaxInstallerBytes = 200 * 1024 * 1024;
    private static readonly HashSet<string> AllowedCoverExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif",
    };
    private static readonly HashSet<string> AllowedInstallerExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".zip", ".rar", ".7z", ".exe", ".msi", ".dmg", ".pkg", ".deb", ".rpm", ".apk",
    };

    [HttpGet("Search")]
    public Task<IActionResult> Search([FromQuery] SearchSoftwareQuery query)
        => Query<SearchSoftwareQuery, PagedData<SoftwareListItemQri>>(query);

    [HttpGet("GetBySlug")]
    public Task<IActionResult> GetBySlug([FromQuery] GetSoftwareBySlugQuery query)
        => Query<GetSoftwareBySlugQuery, SoftwarePublicQri?>(query);

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetMySoftware")]
    public Task<IActionResult> GetMySoftware([FromQuery] GetMySoftwareQuery query)
        => Query<GetMySoftwareQuery, List<SoftwarePublicQri>>(query);

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPut("SaveTeacherSoftware")]
    [HttpPost("SaveTeacherSoftware")]
    public Task<IActionResult> SaveTeacherSoftware([FromBody] SaveTeacherSoftwareCommand command)
        => Edit<SaveTeacherSoftwareCommand, long>(command);

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPut("SavePlatformSoftware")]
    [HttpPost("SavePlatformSoftware")]
    public Task<IActionResult> SavePlatformSoftware([FromBody] SavePlatformSoftwareCommand command)
        => Edit<SavePlatformSoftwareCommand, long>(command);

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpDelete("Delete")]
    public Task<IActionResult> Delete([FromBody] DeleteSoftwareCommand command)
        => Delete<DeleteSoftwareCommand, string>(command);

    [HttpPost("RecordDownload")]
    public Task<IActionResult> RecordDownload([FromBody] RecordSoftwareDownloadCommand command)
        => Edit<RecordSoftwareDownloadCommand, int>(command);

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("ToggleLike")]
    public Task<IActionResult> ToggleLike([FromBody] ToggleSoftwareLikeCommand command)
        => Edit<ToggleSoftwareLikeCommand, SoftwareLikeResult>(command);

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("UploadCover")]
    [RequestSizeLimit(MaxCoverBytes)]
    public async Task<IActionResult> UploadCover(
        IFormFile file,
        [FromServices] ITeacherQueryRepository teacherQueryRepository)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "File is required." });
        if (file.Length > MaxCoverBytes)
            return BadRequest(new { message = "Image must be 5 MB or smaller." });
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedCoverExtensions.Contains(ext))
            return BadRequest(new { message = "Unsupported image format." });

        var userId = ResolveUserId();
        if (userId <= 0)
            return Unauthorized();

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
        var folderName = teacherId is > 0 ? teacherId.Value.ToString() : $"user-{userId}";
        var url = await pathSaver.SavePublicAsync(file, $"images/software/{folderName}");
        return Ok(new { url });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("UploadInstaller")]
    [RequestSizeLimit(MaxInstallerBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxInstallerBytes)]
    public async Task<IActionResult> UploadInstaller(
        IFormFile file,
        [FromServices] ITeacherQueryRepository teacherQueryRepository)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "File is required." });
        if (file.Length > MaxInstallerBytes)
            return BadRequest(new { message = "Installer must be 200 MB or smaller." });
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedInstallerExtensions.Contains(ext))
            return BadRequest(new { message = "Unsupported installer format." });

        var userId = ResolveUserId();
        if (userId <= 0)
            return Unauthorized();

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
        var folderName = teacherId is > 0 ? teacherId.Value.ToString() : $"user-{userId}";
        var safeOriginal = Path.GetFileName(file.FileName);
        var url = await pathSaver.SavePublicAsync(file, $"files/software/{folderName}");
        return Ok(new { url, fileName = safeOriginal });
    }

    private long ResolveUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("userId")?.Value
            ?? User.FindFirst("nameid")?.Value;
        return long.TryParse(claim, out var userId) ? userId : 0;
    }
}
