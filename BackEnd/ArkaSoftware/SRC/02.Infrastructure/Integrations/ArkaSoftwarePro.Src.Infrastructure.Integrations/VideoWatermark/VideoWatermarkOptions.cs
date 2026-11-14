namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.VideoWatermark;

public class VideoWatermarkOptions
{
    public const string SectionName = "VideoWatermark";

    public bool Enabled { get; set; } = true;

    /// <summary>FFmpeg executable path. When empty, "ffmpeg" is resolved from PATH.</summary>
    public string? FfmpegPath { get; set; }

    /// <summary>Relative path under wwwroot for the overlay logo image.</summary>
    public string LogoRelativePath { get; set; } = "brand/icon-512.png";

    /// <summary>Overlay margin from bottom-right corner in pixels.</summary>
    public int MarginPx { get; set; } = 20;

    /// <summary>Logo width as a fraction of video width (0.05 - 0.35).</summary>
    public double LogoWidthRatio { get; set; } = 0.14;

    /// <summary>Logo opacity from 0.2 to 1.</summary>
    public double LogoOpacity { get; set; } = 0.75;
}
