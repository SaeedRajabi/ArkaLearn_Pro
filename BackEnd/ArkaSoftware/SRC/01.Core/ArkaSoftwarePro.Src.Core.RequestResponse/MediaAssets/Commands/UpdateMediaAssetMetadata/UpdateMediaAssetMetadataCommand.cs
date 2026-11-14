using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.UpdateMediaAssetMetadata;

public class UpdateMediaAssetMetadataCommand : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public long RequestingUserId { get; set; }
    public bool IsAdmin { get; set; }
    public string? Title { get; set; }
    public string? AltText { get; set; }
    public string? Caption { get; set; }
    public string? Description { get; set; }
    public string Path => "/api/Service/Media/UpdateMetadata";
}
