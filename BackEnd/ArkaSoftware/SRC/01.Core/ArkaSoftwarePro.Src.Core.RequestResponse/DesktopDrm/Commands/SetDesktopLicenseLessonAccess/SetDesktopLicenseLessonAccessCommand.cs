using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.SetDesktopLicenseLessonAccess;

public class SetDesktopLicenseLessonAccessCommand : ICommand<DesktopLicenseLessonAccessResultQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
    public long[] LessonIds { get; set; } = [];
}

public class DesktopLicenseLessonAccessResultQri
{
    public long EnrollmentId { get; set; }
    public long[] AllowedLessonIds { get; set; } = [];
}
