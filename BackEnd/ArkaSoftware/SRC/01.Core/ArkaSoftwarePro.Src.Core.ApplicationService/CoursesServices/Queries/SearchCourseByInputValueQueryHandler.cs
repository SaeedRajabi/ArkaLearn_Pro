using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries
{
    public class SearchCourseByInputValueQueryHandler : QueryHandler<SearchCourseByInputValueQuery, PagedData<SearchCourseQri>>
    {
        private readonly ICourseQueriesRepository _courseQueriesRepository;
        public SearchCourseByInputValueQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService,
            ICourseQueriesRepository courseQueriesRepository) : base(mafiaOuterService)
        {
            _courseQueriesRepository = courseQueriesRepository;
        }

        public override async Task<QueryResult<PagedData<SearchCourseQri>>> Handle(SearchCourseByInputValueQuery query)
        {
            var result = await _courseQueriesRepository.SearchCourseExecuteAsync(query);
            if (result is null)
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
        }
    }
}
