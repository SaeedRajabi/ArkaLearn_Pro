using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.DeletePromotionalVideo;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class DeletePromotionalVideoCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<DeletePromotionalVideoCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeletePromotionalVideoCommand command)
    {
        if (!TeacherContentTargetResolver.TryGetAuthenticatedUserId(httpContextAccessor, out _))
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var isAdmin = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User);
        Domain.TeacherAggregate.Entities.Teacher? teacher;
        if (isAdmin)
        {
            teacher = command.TeacherUserId is > 0
                ? await teacherCommandRepository.GetByUserIdWithDetailsAsync(command.TeacherUserId.Value)
                : await teacherCommandRepository.GetByPromotionalVideoIdAsync(command.VideoId);
        }
        else
        {
            if (!TeacherContentTargetResolver.TryGetAuthenticatedUserId(httpContextAccessor, out var userId))
                return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);
            teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(userId);
        }

        if (teacher == null || teacher.PromotionalVideos.All(v => v.Id != command.VideoId))
            return await ResultAsync("Video not found.", ApplicationServiceStatus.NotFound);

        teacher.RemovePromotionalVideo(command.VideoId);
        await teacherCommandRepository.CommitAsync();
        return await OkAsync("Video deleted.");
    }
}
