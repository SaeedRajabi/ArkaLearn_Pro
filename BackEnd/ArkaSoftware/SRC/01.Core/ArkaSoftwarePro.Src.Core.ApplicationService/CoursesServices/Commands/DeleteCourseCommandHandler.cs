using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.DeleteCourse;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class DeleteCourseCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEntityPermanentDeletionService permanentDeletionService)
    : CommandHandler<DeleteCourseCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteCourseCommand command)
    {
        var deleted = await permanentDeletionService.PermanentlyDeleteCourseAsync(command.CourseId);
        if (!deleted)
            return await ResultAsync("Course not found.", ApplicationServiceStatus.NotFound);

        return await OkAsync("Course permanently deleted.");
    }
}
