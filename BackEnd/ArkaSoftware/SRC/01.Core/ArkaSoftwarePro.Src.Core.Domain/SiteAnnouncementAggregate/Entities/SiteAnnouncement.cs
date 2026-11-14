using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.SiteAnnouncementAggregate.Entities;

public enum SiteAnnouncementBackgroundType : byte
{
    Solid = 0,
    Gradient = 1,
    Image = 2
}

/// <summary>Public site-wide announcement bar shown above the header.</summary>
public class SiteAnnouncement : AggregateRoot
{
    public bool IsEnabled { get; private set; }
    public string ContentHtml { get; private set; } = string.Empty;
    public string TextColor { get; private set; } = "#ffffff";
    public SiteAnnouncementBackgroundType BackgroundType { get; private set; } = SiteAnnouncementBackgroundType.Solid;
    public string BackgroundColor { get; private set; } = "#2563eb";
    public string GradientStartColor { get; private set; } = "#2563eb";
    public string GradientEndColor { get; private set; } = "#7c3aed";
    public int GradientAngle { get; private set; } = 90;
    public string BackgroundImageUrl { get; private set; } = string.Empty;

    private SiteAnnouncement()
    {
    }

    public SiteAnnouncement(
        bool isEnabled,
        string contentHtml,
        string textColor,
        SiteAnnouncementBackgroundType backgroundType,
        string backgroundColor,
        string gradientStartColor,
        string gradientEndColor,
        int gradientAngle,
        string backgroundImageUrl)
    {
        Update(
            isEnabled,
            contentHtml,
            textColor,
            backgroundType,
            backgroundColor,
            gradientStartColor,
            gradientEndColor,
            gradientAngle,
            backgroundImageUrl);
    }

    public void Update(
        bool isEnabled,
        string contentHtml,
        string textColor,
        SiteAnnouncementBackgroundType backgroundType,
        string backgroundColor,
        string gradientStartColor,
        string gradientEndColor,
        int gradientAngle,
        string backgroundImageUrl)
    {
        IsEnabled = isEnabled;
        ContentHtml = contentHtml ?? string.Empty;
        TextColor = NormalizeColor(textColor, "#ffffff");
        BackgroundType = backgroundType;
        BackgroundColor = NormalizeColor(backgroundColor, "#2563eb");
        GradientStartColor = NormalizeColor(gradientStartColor, "#2563eb");
        GradientEndColor = NormalizeColor(gradientEndColor, "#7c3aed");
        GradientAngle = NormalizeAngle(gradientAngle);
        BackgroundImageUrl = backgroundImageUrl?.Trim() ?? string.Empty;
    }

    private static string NormalizeColor(string? value, string fallback)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
            return fallback;

        if (trimmed.StartsWith('#') && (trimmed.Length == 7 || trimmed.Length == 4))
            return trimmed.ToLowerInvariant();

        return fallback;
    }

    private static int NormalizeAngle(int angle)
    {
        var normalized = angle % 360;
        return normalized < 0 ? normalized + 360 : normalized;
    }
}
