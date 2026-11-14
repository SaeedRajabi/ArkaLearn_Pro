using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourseLessonProgress;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetMyCourseLessonProgressQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseQueriesRepository courseQueriesRepository)
    : QueryHandler<GetMyCourseLessonProgressQuery, List<LessonWatchProgressQri>>(outer)
{
    public override async Task<QueryResult<List<LessonWatchProgressQri>>> Handle(GetMyCourseLessonProgressQuery query)
    {
        if (query.UserId <= 0 || query.CourseId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        if (!await courseQueriesRepository.HasActiveEnrollmentAsync(query.UserId, query.CourseId))
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        var progress = await courseQueriesRepository.GetMyCourseLessonProgressAsync(query.UserId, query.CourseId);
        return await ResultAsync(progress, ApplicationServiceStatus.Ok);
    }
}
