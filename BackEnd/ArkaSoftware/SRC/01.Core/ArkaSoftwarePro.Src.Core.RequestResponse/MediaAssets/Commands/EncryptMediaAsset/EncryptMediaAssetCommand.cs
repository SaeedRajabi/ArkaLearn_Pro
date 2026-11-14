using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.EncryptMediaAsset;

public class EncryptMediaAssetCommand : ICommand<string>
{
    public long MediaAssetId { get; set; }
    public string PhysicalFilePath { get; set; } = string.Empty;
    public string WebRootPath { get; set; } = string.Empty;
}
