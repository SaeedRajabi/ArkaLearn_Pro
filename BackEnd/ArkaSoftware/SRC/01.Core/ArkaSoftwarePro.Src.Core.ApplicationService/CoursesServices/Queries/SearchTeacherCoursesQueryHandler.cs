using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchTeacherCourses;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class SearchTeacherCoursesQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ICourseQueriesRepository courseQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<SearchTeacherCoursesQuery, PagedData<SearchCourseQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<PagedData<SearchCourseQri>>> Handle(SearchTeacherCoursesQuery query)
    {
        if (query.TeacherUserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(query.TeacherUserId);
        if (!teacherId.HasValue || teacherId.Value <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = await courseQueriesRepository.SearchTeacherCoursesExecuteAsync(query);
        if (result is null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
