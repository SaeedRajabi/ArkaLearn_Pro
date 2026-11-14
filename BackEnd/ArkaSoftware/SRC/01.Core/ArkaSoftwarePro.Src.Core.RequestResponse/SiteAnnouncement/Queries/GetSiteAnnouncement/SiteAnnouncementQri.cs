namespace ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Queries.GetSiteAnnouncement;

public class SiteAnnouncementQri
{
    public long Id { get; set; }
    public bool IsEnabled { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string TextColor { get; set; } = "#ffffff";
    public byte BackgroundType { get; set; }
    public string BackgroundColor { get; set; } = "#2563eb";
    public string GradientStartColor { get; set; } = "#2563eb";
    public string GradientEndColor { get; set; } = "#7c3aed";
    public int GradientAngle { get; set; } = 90;
    public string BackgroundImageUrl { get; set; } = string.Empty;
    public DateTime? LastModifiedAt { get; set; }
}
