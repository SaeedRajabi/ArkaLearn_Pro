using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourses;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetMyCoursesQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ICourseQueriesRepository courseQueriesRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetMyCoursesQuery, List<GetMyCoursesQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<List<GetMyCoursesQri>>> Handle(GetMyCoursesQuery query)
    {
        try
        {
            var userId = query.UserId;
            if (userId <= 0)
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                  ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
                                  ?? httpContextAccessor.HttpContext?.User?.FindFirst("nameid")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out userId))
                    return await ResultAsync(new List<GetMyCoursesQri>(), ApplicationServiceStatus.NotFound);
            }

            query.UserId = userId;
            // Backfill licenses for enrollments that predates desktop-delivery conversion.
            await enrollmentCommandRepository.EnsureDesktopLicensesForUserAsync(userId);
            var userCoursesQueryAsync = await courseQueriesRepository.GetMyCoursesAsync(query);
            if (userCoursesQueryAsync == null!)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(userCoursesQueryAsync, ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
