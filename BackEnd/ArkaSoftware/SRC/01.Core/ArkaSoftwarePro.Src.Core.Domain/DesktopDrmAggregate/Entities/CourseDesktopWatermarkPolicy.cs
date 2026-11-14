using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

/// <summary>
/// Course-level watermark template applied to all desktop licenses for that course.
/// Platform logo watermark is NOT stored here and cannot be changed by teachers.
/// </summary>
public class CourseDesktopWatermarkPolicy : AggregateRoot
{
    public long CourseId { get; private set; }
    /// <summary>Template with tokens e.g. {FullName} | {Email} | {Phone}</summary>
    public string TextTemplate { get; private set; } = "{FullName} | {Email}";
    public int FontSize { get; private set; } = 16;
    public string FontColor { get; private set; } = "#FFFFFF";
    public double Opacity { get; private set; } = 0.55;
    public DesktopWatermarkPosition Position { get; private set; } = DesktopWatermarkPosition.BottomRight;
    public double RotationDeg { get; private set; }
    public DesktopWatermarkMovement Movement { get; private set; } = DesktopWatermarkMovement.None;
    public int PaddingPx { get; private set; } = 16;
    public DateTime UpdatedAtUtc { get; private set; }

    private CourseDesktopWatermarkPolicy() { }

    public static CourseDesktopWatermarkPolicy CreateDefault(long courseId)
    {
        if (courseId <= 0) throw new ArgumentException("Course id is required.", nameof(courseId));
        return new CourseDesktopWatermarkPolicy
        {
            CourseId = courseId,
            UpdatedAtUtc = DateTime.UtcNow,
        };
    }

    public void Update(
        string textTemplate,
        int fontSize,
        string fontColor,
        double opacity,
        DesktopWatermarkPosition position,
        double rotationDeg,
        DesktopWatermarkMovement movement,
        int paddingPx)
    {
        if (string.IsNullOrWhiteSpace(textTemplate))
            throw new ArgumentException("Text template is required.", nameof(textTemplate));

        TextTemplate = textTemplate.Trim();
        FontSize = Math.Clamp(fontSize, 8, 72);
        FontColor = string.IsNullOrWhiteSpace(fontColor) ? "#FFFFFF" : fontColor.Trim();
        Opacity = Math.Clamp(opacity, 0.05, 1.0);
        Position = position;
        RotationDeg = Math.Clamp(rotationDeg, -45, 45);
        Movement = movement;
        PaddingPx = Math.Clamp(paddingPx, 0, 120);
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
