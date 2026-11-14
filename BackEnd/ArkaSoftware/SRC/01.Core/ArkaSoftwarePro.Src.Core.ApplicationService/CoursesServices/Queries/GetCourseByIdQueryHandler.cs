using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries
{
    public class GetCourseByIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        ICourseQueriesRepository courseQueriesRepository)
        : QueryHandler<GetCourseByIdQuery, CourseQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<CourseQri>> Handle(GetCourseByIdQuery query)
        {
            var courseByIdExecuteAsync = await courseQueriesRepository.GetCourseByIdExecuteAsync(query);
            if (courseByIdExecuteAsync == null!)
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
            return await ResultAsync(courseByIdExecuteAsync, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
        }
    }
}
