using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpdateCourseDesktopWatermarkPolicy;

public class UpdateCourseDesktopWatermarkPolicyCommand : ICommand<CourseDesktopWatermarkPolicyResultQri>
{
    public long RequestingUserId { get; set; }
    public long CourseId { get; set; }
    public string TextTemplate { get; set; } = "{FullName} | {Email}";
    public int FontSize { get; set; } = 16;
    public string FontColor { get; set; } = "#FFFFFF";
    public double Opacity { get; set; } = 0.55;
    public DesktopWatermarkPosition Position { get; set; } = DesktopWatermarkPosition.BottomRight;
    public double RotationDeg { get; set; }
    public DesktopWatermarkMovement Movement { get; set; } = DesktopWatermarkMovement.None;
    public int PaddingPx { get; set; } = 16;
}

public class CourseDesktopWatermarkPolicyResultQri
{
    public long CourseId { get; set; }
    public string TextTemplate { get; set; } = string.Empty;
    public int FontSize { get; set; }
    public string FontColor { get; set; } = string.Empty;
    public double Opacity { get; set; }
    public DesktopWatermarkPosition Position { get; set; }
    public double RotationDeg { get; set; }
    public DesktopWatermarkMovement Movement { get; set; }
    public int PaddingPx { get; set; }
    public bool PlatformLogoLocked { get; set; } = true;
    public DateTime UpdatedAtUtc { get; set; }
}
