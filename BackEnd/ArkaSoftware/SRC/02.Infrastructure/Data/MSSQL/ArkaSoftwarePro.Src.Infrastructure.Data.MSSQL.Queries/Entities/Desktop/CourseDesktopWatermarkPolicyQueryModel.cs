using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;

public class CourseDesktopWatermarkPolicyQueryModel
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public string TextTemplate { get; set; } = string.Empty;
    public int FontSize { get; set; }
    public string FontColor { get; set; } = string.Empty;
    public double Opacity { get; set; }
    public DesktopWatermarkPosition Position { get; set; }
    public double RotationDeg { get; set; }
    public DesktopWatermarkMovement Movement { get; set; }
    public int PaddingPx { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public bool IsDelete { get; set; }
}
