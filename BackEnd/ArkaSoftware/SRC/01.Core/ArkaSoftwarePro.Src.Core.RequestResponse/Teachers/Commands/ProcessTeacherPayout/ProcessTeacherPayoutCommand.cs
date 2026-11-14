using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Endpoints;



namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ProcessTeacherPayout;



public class ProcessTeacherPayoutCommand : ICommand<string>, IWebRequest

{

    public long PayoutId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? TransferReference { get; set; }

    public string? AdminNote { get; set; }

    public string Path => "/api/Service/Teacher/ProcessTeacherPayout";

}

