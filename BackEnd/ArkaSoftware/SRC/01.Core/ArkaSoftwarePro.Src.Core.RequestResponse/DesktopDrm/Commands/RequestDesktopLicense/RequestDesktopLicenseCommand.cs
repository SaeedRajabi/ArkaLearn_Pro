using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RequestDesktopLicense;

public class RequestDesktopLicenseCommand : ICommand<string>, IWebRequest
{
    public long CourseId { get; set; }

    public string Path => "api/Service/DesktopDrm/RequestDesktopLicense";
}
