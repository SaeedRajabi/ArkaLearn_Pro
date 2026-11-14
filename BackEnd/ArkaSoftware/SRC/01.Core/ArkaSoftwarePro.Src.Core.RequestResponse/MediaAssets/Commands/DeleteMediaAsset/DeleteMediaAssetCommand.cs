using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.DeleteMediaAsset;

public class DeleteMediaAssetCommand : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public long RequestingUserId { get; set; }
    public bool IsAdmin { get; set; }
    public string Path => "/api/Service/Media/Delete";
}
