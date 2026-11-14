using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RegisterDesktopDevice;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopAccessStatus;

public class GetDesktopAccessStatusQuery : IQuery<DesktopAccessStatusQri>
{
    public long UserId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public bool CheckVideoPlayback { get; set; }
}
