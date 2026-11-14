using ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Queries.GetUserFiles;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Uploads;
using ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public class UserFileController(UserFileApplicationService files) : BaseController
    {
        private const int MaxChunkSizeBytes = FileUploadLimits.MaxChunkSize;
        public sealed record UploadFileChunkRequest
        {
            public string UploadId { get; init; } = string.Empty;
            public int ChunkIndex { get; init; }
            public IFormFile? Chunk { get; init; }
        }

        [HttpPost("CreateFolder")]
        public async Task<IActionResult> CreateFolder([FromBody] CreateUserFolderCommand command)
            => this.ToHttpResult(await files.CreateFolder(command));

        [HttpPut("Rename")]
        [HttpPost("Rename")]
        public async Task<IActionResult> Rename([FromBody] RenameUserFileCommand command)
            => this.ToHttpResult(await files.Rename(command));

        [HttpDelete("Delete")]
        [HttpPost("Delete")]
        public async Task<IActionResult> Delete(
            [FromQuery] long? fileId,
            [FromQuery] long? userId,
            [FromBody] DeleteUserFileCommand? command)
            => this.ToHttpResult(await files.Delete(fileId, userId, command));

        [HttpGet("GetFiles")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> GetFiles([FromQuery] GetUserFilesQuery query)
        {
            Response.Headers.CacheControl = "no-store, no-cache, must-revalidate, max-age=0";
            Response.Headers.Pragma = "no-cache";
            Response.Headers.Expires = "0";
            return this.ToHttpResult(await files.GetFiles(query));
        }

        [HttpGet("GetMyFiles")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> GetMyFiles([FromQuery] long? parentId)
        {
            Response.Headers.CacheControl = "no-store, no-cache, must-revalidate, max-age=0";
            Response.Headers.Pragma = "no-cache";
            Response.Headers.Expires = "0";
            return this.ToHttpResult(await files.GetMyFiles(parentId));
        }

        /// <summary>Authenticated download with HTTP Range support for resumable transfers.</summary>
        [HttpGet("Download")]
        public async Task<IActionResult> Download([FromQuery] long fileId)
            => this.ToHttpResult(await files.Download(fileId));

        /// <summary>
        /// Called by the student client after a download finishes (not on each Range request).
        /// </summary>
        [HttpPost("NotifyDownloadCompleted")]
        public async Task<IActionResult> NotifyDownloadCompleted([FromBody] NotifyDownloadCompletedRequest? request)
            => this.ToHttpResult(await files.NotifyDownloadCompleted(request));

        [HttpPost("UploadFile")]
        [ApiExplorerSettings(IgnoreApi = true)]
        [RequestSizeLimit(MaxChunkSizeBytes + 512 * 1024)]
        [RequestFormLimits(MemoryBufferThreshold = MaxChunkSizeBytes + 512 * 1024,
            MultipartBodyLengthLimit = MaxChunkSizeBytes + 512 * 1024)]
        public async Task<IActionResult> UploadFile(
            [FromForm] long userId,
            [FromForm] long? parentId,
            [FromForm] IFormFile file)
            => this.ToHttpResult(await files.UploadFile(userId, parentId, file.ToUploadContent()));

        /// <summary>Initialize a resumable upload whose bytes stay on the download host.</summary>
        [HttpPost("UploadFileInit")]
        public async Task<IActionResult> UploadFileInit([FromBody] UploadFileInitRequest request)
            => this.ToHttpResult(await files.UploadFileInit(request));

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpPost("UploadFileChunk")]
        [RequestSizeLimit(MaxChunkSizeBytes + 512 * 1024)]
        [RequestFormLimits(MemoryBufferThreshold = MaxChunkSizeBytes + 512 * 1024,
            MultipartBodyLengthLimit = MaxChunkSizeBytes + 512 * 1024)]
        public async Task<IActionResult> UploadFileChunk([FromForm] UploadFileChunkRequest request)
            => this.ToHttpResult(await files.UploadFileChunk(new UploadFileChunkRequest<UploadContent> { UploadId = request.UploadId, ChunkIndex = request.ChunkIndex, Chunk = request.Chunk.ToUploadContent() }));

        [HttpPost("UploadFileComplete")]
        public async Task<IActionResult> UploadFileComplete([FromBody] UploadFileCompleteRequest request)
            => this.ToHttpResult(await files.UploadFileComplete(request));

        [HttpPost("UploadFileAbort")]
        public async Task<IActionResult> UploadFileAbort([FromBody] UploadFileAbortRequest request)
            => this.ToHttpResult(await files.UploadFileAbort(request));

        [HttpGet("GetStorageUsage")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> GetStorageUsage()
            => this.ToHttpResult(await files.GetStorageUsage());
    }
}
