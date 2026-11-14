using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.FollowTeacher;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class FollowTeacherCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository)
    : CommandHandler<FollowTeacherCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(FollowTeacherCommand command)
    {
        if (command.UserId <= 0 || command.TeacherId <= 0)
            return await ResultAsync("Invalid request.", ApplicationServiceStatus.ValidationError);

        var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(command.TeacherId);
        if (teacher?.UserId is not > 0)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        if (teacher.UserId == command.UserId)
            return await ResultAsync("You cannot follow yourself.", ApplicationServiceStatus.ValidationError);

        if (!await teacherCommandRepository.IsUserFollowingTeacherAsync(command.UserId, command.TeacherId))
        {
            await teacherCommandRepository.AddTeacherFollowAsync(
                TeacherFollow.Create(command.UserId, command.TeacherId));
            await teacherCommandRepository.CommitAsync();
        }

        return await OkAsync("followed");
    }
}
