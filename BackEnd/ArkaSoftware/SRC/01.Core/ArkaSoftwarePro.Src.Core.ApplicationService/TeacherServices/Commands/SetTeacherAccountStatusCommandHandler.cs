using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SetTeacherAccountStatus;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class SetTeacherAccountStatusCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository)
    : CommandHandler<SetTeacherAccountStatusCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SetTeacherAccountStatusCommand command)
    {
        if (!TryParseStatus(command.Status, out var status))
            return await ResultAsync("Invalid account status.", ApplicationServiceStatus.ValidationError);

        var teacher = await teacherCommandRepository.GetAsync(command.TeacherId);
        if (teacher == null)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        teacher.SetAccountStatus(status, command.Note);
        await teacherCommandRepository.CommitAsync();

        return await ResultAsync("Teacher account status updated.", ApplicationServiceStatus.Ok);
    }

    private static bool TryParseStatus(string? raw, out TeacherAccountStatus status)
    {
        status = TeacherAccountStatus.Active;
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        return raw.Trim().ToLowerInvariant() switch
        {
            "active" => Assign(TeacherAccountStatus.Active, out status),
            "blocked" or "block" => Assign(TeacherAccountStatus.Blocked, out status),
            "terminated" or "terminate" or "dismissed" or "dismiss" => Assign(TeacherAccountStatus.Terminated, out status),
            _ => false,
        };
    }

    private static bool Assign(TeacherAccountStatus value, out TeacherAccountStatus status)
    {
        status = value;
        return true;
    }
}
