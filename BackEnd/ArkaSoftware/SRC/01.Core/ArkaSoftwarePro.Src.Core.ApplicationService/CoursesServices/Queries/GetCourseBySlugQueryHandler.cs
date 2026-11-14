using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetCourseBySlugQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ICourseQueriesRepository courseQueriesRepository)
    : QueryHandler<GetCourseBySlugQuery, CourseQri>(mafiaOuterService)
{
    public override async Task<QueryResult<CourseQri>> Handle(GetCourseBySlugQuery query)
    {
        var result = await courseQueriesRepository.GetCourseBySlugExecuteAsync(query);
        if (result == null || result.CourseId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
