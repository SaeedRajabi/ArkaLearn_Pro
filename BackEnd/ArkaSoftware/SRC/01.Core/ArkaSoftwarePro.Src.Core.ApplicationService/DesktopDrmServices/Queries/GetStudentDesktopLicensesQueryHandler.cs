using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetStudentDesktopLicenses;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class GetStudentDesktopLicensesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmQueryRepository repository,
    ICourseQueriesRepository courseQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetStudentDesktopLicensesQuery, List<StudentDesktopLicenseQri>>(outer)
{
    public override async Task<QueryResult<List<StudentDesktopLicenseQri>>> Handle(GetStudentDesktopLicensesQuery query)
    {
        if (query.RequestingUserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        if (query.TargetUserId <= 0 && query.StudentId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var isAdmin = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User);
        long? teacherIdFilter = null;

        if (!isAdmin)
        {
            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(query.RequestingUserId);
            if (!teacherId.HasValue)
            {
                AddMessage("Access denied.");
                return await ResultAsync([], ApplicationServiceStatus.ValidationError);
            }

            if (query.TargetUserId > 0 &&
                !await courseQueriesRepository.IsPortalUserInTeacherScopeAsync(query.RequestingUserId, query.TargetUserId))
            {
                AddMessage("Student is not in your scope.");
                return await ResultAsync([], ApplicationServiceStatus.ValidationError);
            }

            teacherIdFilter = teacherId.Value;
        }

        var items = await repository.ListStudentDesktopLicensesAsync(
            query.TargetUserId,
            query.StudentId,
            teacherIdFilter);

        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}
