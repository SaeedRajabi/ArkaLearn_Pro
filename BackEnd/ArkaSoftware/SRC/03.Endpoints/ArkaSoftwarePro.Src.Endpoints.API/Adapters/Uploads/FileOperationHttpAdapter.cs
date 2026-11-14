using ArkaSoftwarePro.Src.Core.RequestResponse.Common;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;

public static class FileOperationHttpAdapter
{
    public static IActionResult ToHttpResult(this ControllerBase controller, FileOperationResult result) => result.Kind switch
    {
        FileOperationOutcome.Success => controller.Ok(result.Data),
        FileOperationOutcome.Created => controller.StatusCode(StatusCodes.Status201Created, result.Data),
        FileOperationOutcome.Invalid => controller.BadRequest(result.Data),
        FileOperationOutcome.Missing => controller.NotFound(result.Data),
        FileOperationOutcome.Unauthenticated => controller.Unauthorized(),
        FileOperationOutcome.Denied => result.Data is null ? controller.Forbid() : controller.StatusCode(StatusCodes.Status403Forbidden, result.Data),
        FileOperationOutcome.Conflict => controller.Conflict(result.Data),
        FileOperationOutcome.StorageFailure => controller.StatusCode(StatusCodes.Status502BadGateway, result.Data),
        FileOperationOutcome.Redirect when result.Data is string url => controller.Redirect(url),
        FileOperationOutcome.NoContent => controller.NoContent(),
        FileOperationOutcome.Download when result.Data is FileDownload download =>
            controller.File(download.Content, download.ContentType, download.FileName, enableRangeProcessing: true),
        _ => throw new InvalidOperationException("Unsupported file operation outcome.")
    };
}
