using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.DeleteTeacherBook;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class DeleteTeacherBookCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<DeleteTeacherBookCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteTeacherBookCommand command)
    {
        if (!TeacherContentTargetResolver.TryGetAuthenticatedUserId(httpContextAccessor, out _))
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var isAdmin = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User);
        Domain.TeacherAggregate.Entities.Teacher? teacher;
        if (isAdmin)
        {
            teacher = command.TeacherUserId is > 0
                ? await teacherCommandRepository.GetByUserIdWithDetailsAsync(command.TeacherUserId.Value)
                : await teacherCommandRepository.GetByBookIdAsync(command.BookId);
        }
        else
        {
            if (!TeacherContentTargetResolver.TryGetAuthenticatedUserId(httpContextAccessor, out var userId))
                return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);
            teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(userId);
        }

        if (teacher == null || teacher.Books.All(b => b.Id != command.BookId))
            return await ResultAsync("Book not found.", ApplicationServiceStatus.NotFound);

        teacher.RemoveBook(command.BookId);
        await teacherCommandRepository.CommitAsync();
        return await OkAsync("Book deleted.");
    }
}
