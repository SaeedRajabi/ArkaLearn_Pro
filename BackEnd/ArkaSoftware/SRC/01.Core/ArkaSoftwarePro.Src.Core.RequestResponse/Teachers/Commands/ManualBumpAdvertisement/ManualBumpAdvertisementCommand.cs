using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ManualBumpAdvertisement;

public class ManualBumpAdvertisementCommand : ICommand<ManualBumpAdvertisementResultQri>, IWebRequest
{
    public string CaptchaId { get; set; } = string.Empty;
    public string CaptchaCode { get; set; } = string.Empty;
    public string Path => "/api/Service/Teacher/ManualBumpAdvertisement";
}

public class ManualBumpAdvertisementResultQri
{
    public DateTime BumpedAtUtc { get; set; }
    public DateTime? NextManualBumpAtUtc { get; set; }
    public int ManualBumpCooldownMinutes { get; set; }
}
