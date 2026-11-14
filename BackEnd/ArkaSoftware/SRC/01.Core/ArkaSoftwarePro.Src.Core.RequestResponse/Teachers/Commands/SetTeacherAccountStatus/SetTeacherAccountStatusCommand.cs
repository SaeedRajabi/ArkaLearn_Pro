using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SetTeacherAccountStatus;

public class SetTeacherAccountStatusCommand : ICommand<string>, IWebRequest
{
    public long TeacherId { get; set; }
    /// <summary>active | blocked | terminated</summary>
    public string Status { get; set; } = "active";
    public string? Note { get; set; }
    public string Path => "api/Service/Teacher/SetAccountStatus";
}
