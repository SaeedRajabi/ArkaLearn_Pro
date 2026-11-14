using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllCommentsByCourseId;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries
{
    public class GetAllCommentsByCourseIdQueryHandler : QueryHandler<GetAllCommentsByCourseIdQuery, PagedData<GetAllCommentsByCourseIdQri>>
    {
        private readonly ICourseQueriesRepository _courseQueryRepository;
        public GetAllCommentsByCourseIdQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService, ICourseQueriesRepository courseQueryRepository) : base(mafiaOuterService)
        {
            _courseQueryRepository = courseQueryRepository;
        }

        public override async Task<QueryResult<PagedData<GetAllCommentsByCourseIdQri>>> Handle(GetAllCommentsByCourseIdQuery query)
        {
            try
            {
                var result = await _courseQueryRepository.GetAllCourseCommentsById(query);
                if (result == null)
                    return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
                return await ResultAsync(result , Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
            }
            catch (Exception)
            {
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
