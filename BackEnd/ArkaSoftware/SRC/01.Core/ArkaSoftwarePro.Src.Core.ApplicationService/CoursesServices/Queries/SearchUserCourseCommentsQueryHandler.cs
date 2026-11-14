using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchUserCourseComments;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class SearchUserCourseCommentsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseQueriesRepository courseQueriesRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<SearchUserCourseCommentsQuery, PagedData<SearchUserCourseCommentQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SearchUserCourseCommentQri>>> Handle(SearchUserCourseCommentsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(new PagedData<SearchUserCourseCommentQri>(), ApplicationServiceStatus.ValidationError);

        if (query.UserId <= 0)
            return await ResultAsync(new PagedData<SearchUserCourseCommentQri>(), ApplicationServiceStatus.ValidationError);

        var result = await courseQueriesRepository.SearchUserCourseCommentsAsync(query);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
