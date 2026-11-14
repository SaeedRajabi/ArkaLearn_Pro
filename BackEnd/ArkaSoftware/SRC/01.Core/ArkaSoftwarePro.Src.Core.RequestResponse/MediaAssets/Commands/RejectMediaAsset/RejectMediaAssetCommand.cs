using Framework.Src.Core.RequestResponse.Commands;



namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.RejectMediaAsset;



public class RejectMediaAssetCommand : ICommand<string>

{

    public long Id { get; set; }

    public long RequestingUserId { get; set; }

    public bool IsAdmin { get; set; }

    public string Reason { get; set; } = string.Empty;

}

