using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

namespace ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;

public static class UploadContentAdapter
{
    public static UploadContent? ToUploadContent(this IFormFile? file) => file is null
        ? null
        : new(file.FileName, file.ContentType, file.Length, file.OpenReadStream);
}
