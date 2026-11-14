using Framework.Src.Core.RequestResponse.Commands;



namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.DismissMediaRejection;



public class DismissMediaRejectionCommand : ICommand<string>

{

    public long Id { get; set; }

    public long RequestingUserId { get; set; }

}

