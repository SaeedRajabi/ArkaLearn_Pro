using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ReviewTeacherProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class ReviewTeacherProfileCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ITeacherCommandRepository teacherCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    TeacherProfileNotifier notifier)
    : CommandHandler<ReviewTeacherProfileCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(ReviewTeacherProfileCommand command)
    {
        var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(command.TeacherId);
        if (teacher == null)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        var status = command.Approve ? TeacherApprovalStatus.Approved : TeacherApprovalStatus.Rejected;
        teacher.ReviewProfile(status, command.RejectionNote);

        if (command.Approve)
        {
            var profile = await teacherQueryRepository.GetProfileAsync(
                new GetTeacherProfileQuery { TeacherId = teacher.Id, ForEdit = true },
                includeUnapproved: true);
            var headline = profile?.Headline ?? (string?)teacher.TeacherEducations.FirstOrDefault()?.NameOfInstitutionOrUniversity ?? string.Empty;
            teacher.SetProfileApprovedSnapshot(TeacherReviewSnapshotService.BuildProfileSnapshot(teacher, headline));
        }

        await teacherCommandRepository.CommitAsync();

        var userId = await teacherQueryRepository.GetUserIdByTeacherIdAsync(teacher.Id);
        if (userId is > 0)
            await notifier.NotifyTeacherProfileReviewedAsync(userId.Value, command.Approve, command.RejectionNote);

        return await ResultAsync(command.Approve ? "Profile approved." : "Profile rejected.", ApplicationServiceStatus.Ok);
    }
}
