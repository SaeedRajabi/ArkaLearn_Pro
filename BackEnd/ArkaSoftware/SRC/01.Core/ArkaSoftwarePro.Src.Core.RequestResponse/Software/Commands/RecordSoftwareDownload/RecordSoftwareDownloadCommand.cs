using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.RecordSoftwareDownload;

public class RecordSoftwareDownloadCommand : ICommand<int>, IWebRequest
{
    public long SoftwareId { get; set; }
    public string Path => "/api/Service/Software/RecordDownload";
}
