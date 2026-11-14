using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherBooksQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetTeacherBooksQuery, List<TeacherBookPublicQri>>(outer)
{
    public override async Task<QueryResult<List<TeacherBookPublicQri>>> Handle(GetTeacherBooksQuery query)
    {
        try
        {
            if (TeacherContentTargetResolver.IsAdminListingAllTeachersContent(
                    query.ForEdit,
                    query.UserId,
                    query.TeacherId,
                    query.UserName,
                    httpContextAccessor.HttpContext?.User))
            {
                var allBooks = await teacherCommandRepository.GetAllBooksForAdminEditAsync();
                return await ResultAsync(allBooks, ApplicationServiceStatus.Ok);
            }

            var teacher = await ResolveTeacherAsync(query);
            if (teacher == null)
                return await ResultAsync(new List<TeacherBookPublicQri>(), ApplicationServiceStatus.Ok);

            var books = teacher.Books
                .Where(b => query.ForEdit || (!b.IsDelete && b.ApprovalStatus != TeacherApprovalStatus.Rejected))
                .OrderBy(b => b.SortOrder)
                .ThenByDescending(b => b.Id)
                .Select(b => TeacherBookMapper.ToPublicQri(b, teacher, includeLongDescription: query.ForEdit))
                .ToList();

            return await ResultAsync(books, ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }

    private async Task<Domain.TeacherAggregate.Entities.Teacher?> ResolveTeacherAsync(GetTeacherBooksQuery query)
    {
        if (query.ForEdit)
        {
            if (DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            {
                return await TeacherContentTargetResolver.ResolveTeacherForAdminReadAsync(
                    query.UserId,
                    query.TeacherId,
                    httpContextAccessor,
                    teacherCommandRepository);
            }

            var userId = ResolveAuthenticatedUserId(query.UserId ?? 0, httpContextAccessor);
            if (userId > 0)
                return await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
                    userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        }

        if (query.UserId is > 0)
            return await teacherCommandRepository.GetByUserIdWithDetailsAsync(query.UserId.Value);

        if (query.TeacherId is > 0)
            return await teacherCommandRepository.GetByIdWithDetailsAsync(query.TeacherId.Value);

        if (!string.IsNullOrWhiteSpace(query.UserName))
        {
            var user = userCommandRepository.FindByUserNameAsync(query.UserName);
            if (user?.Id is > 0)
                return await teacherCommandRepository.GetByUserIdWithDetailsAsync(user.Id);
        }

        return null;
    }

    private static long ResolveAuthenticatedUserId(long queryUserId, IHttpContextAccessor httpContextAccessor)
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        if (claim != null && long.TryParse(claim.Value, out var authUserId) && authUserId > 0)
            return authUserId;
        return queryUserId;
    }
}
