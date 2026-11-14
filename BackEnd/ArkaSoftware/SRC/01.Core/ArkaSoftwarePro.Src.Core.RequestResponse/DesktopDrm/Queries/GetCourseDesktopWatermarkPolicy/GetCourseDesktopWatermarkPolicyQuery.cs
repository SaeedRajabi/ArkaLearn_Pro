using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopWatermarkPolicy;

public class GetCourseDesktopWatermarkPolicyQuery : IQuery<CourseDesktopWatermarkPolicyQri?>
{
    public long RequestingUserId { get; set; }
    public long CourseId { get; set; }
}

public class CourseDesktopWatermarkPolicyQri
{
    public long CourseId { get; set; }
    public string TextTemplate { get; set; } = "{FullName} | {Email}";
    public int FontSize { get; set; } = 16;
    public string FontColor { get; set; } = "#FFFFFF";
    public double Opacity { get; set; } = 0.55;
    public DesktopWatermarkPosition Position { get; set; } = DesktopWatermarkPosition.BottomRight;
    public double RotationDeg { get; set; }
    public DesktopWatermarkMovement Movement { get; set; } = DesktopWatermarkMovement.None;
    public int PaddingPx { get; set; } = 16;
    public bool PlatformLogoLocked { get; set; } = true;
    public DateTime? UpdatedAtUtc { get; set; }
}
