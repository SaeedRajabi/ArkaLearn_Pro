using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllPopularCourse;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries
{
    public class GetAllPopularCourseQueryHandler : QueryHandler<GetAllPopularCourseQuery, PagedData<GetAllPopularCourseQri>>
    {
        private readonly ICourseQueriesRepository _courseQueriesRepository;
        public GetAllPopularCourseQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService , ICourseQueriesRepository courseQueriesRepository) : base(mafiaOuterService)
        {
            _courseQueriesRepository = courseQueriesRepository;
        }

        public override async Task<QueryResult<PagedData<GetAllPopularCourseQri>>> Handle(GetAllPopularCourseQuery query)
        {
            try
            {
                var result = await _courseQueriesRepository.GetAllPopularCourseExecuteAsync(query);
                if(result != null)
                    return await ResultAsync(result , Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);

            }
            catch
            {
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
