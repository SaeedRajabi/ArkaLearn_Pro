using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetCourseEnrollments;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.StudentServices.Queries
{
    public class GetCourseEnrollmentsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IStudentQueryRepository studentQueriesRepository)
        : QueryHandler<GetCourseEnrollmentsQuery, PagedData<CourseEnrollmentQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<CourseEnrollmentQri>>> Handle(GetCourseEnrollmentsQuery query)
        {
            var result = await studentQueriesRepository.GetCourseEnrollmentsAsync(query);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
