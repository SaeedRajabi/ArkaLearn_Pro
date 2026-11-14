using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Commands.UpsertSiteAnnouncement;

public class UpsertSiteAnnouncementCommand : ICommand<string>, IWebRequest
{
    public bool IsEnabled { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string TextColor { get; set; } = "#ffffff";
    public byte BackgroundType { get; set; }
    public string BackgroundColor { get; set; } = "#2563eb";
    public string GradientStartColor { get; set; } = "#2563eb";
    public string GradientEndColor { get; set; } = "#7c3aed";
    public int GradientAngle { get; set; } = 90;
    public string? BackgroundImageUrl { get; set; }
    public IFormFile? BackgroundImageFile { get; set; }
    public bool ClearBackgroundImage { get; set; }

    public string Path => "api/Service/SiteAnnouncement/Upsert";
}
