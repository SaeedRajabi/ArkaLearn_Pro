using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UnfollowTeacher;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class UnfollowTeacherCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository)
    : CommandHandler<UnfollowTeacherCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UnfollowTeacherCommand command)
    {
        if (command.UserId <= 0 || command.TeacherId <= 0)
            return await ResultAsync("Invalid request.", ApplicationServiceStatus.ValidationError);

        await teacherCommandRepository.RemoveTeacherFollowAsync(command.UserId, command.TeacherId);
        await teacherCommandRepository.CommitAsync();
        return await OkAsync("unfollowed");
    }
}
