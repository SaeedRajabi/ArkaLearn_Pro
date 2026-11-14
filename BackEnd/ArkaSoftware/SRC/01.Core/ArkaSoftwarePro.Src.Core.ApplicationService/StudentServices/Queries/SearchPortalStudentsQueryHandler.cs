using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.SearchPortalStudents;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.StudentServices.Queries;

public class SearchPortalStudentsQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IStudentQueryRepository studentQueriesRepository)
    : QueryHandler<SearchPortalStudentsQuery, PagedData<PortalStudentQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<PagedData<PortalStudentQri>>> Handle(SearchPortalStudentsQuery query)
    {
        var result = await studentQueriesRepository.SearchPortalStudentsAsync(query);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
