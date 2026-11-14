using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.SaveMediaAsset;

public class SaveMediaAssetCommand : ICommand<long>, IWebRequest
{
    public long OwnerUserId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public MediaType MediaType { get; set; }
    public string? Title { get; set; }
    public string? AltText { get; set; }
    public string? Caption { get; set; }
    public string? Description { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string Path => "/api/Service/Media/Save";
}
