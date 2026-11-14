namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.SiteAnnouncement;

public class SiteAnnouncementQueryModel
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
    public DateTime? CreatedDateTime { get; set; }
    public DateTime? ModifiedDateTime { get; set; }
}
