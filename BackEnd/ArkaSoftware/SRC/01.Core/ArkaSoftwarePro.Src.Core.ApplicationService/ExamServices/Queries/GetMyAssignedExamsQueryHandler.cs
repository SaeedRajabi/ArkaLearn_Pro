using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetMyAssignedExams;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Queries;

public class GetMyAssignedExamsQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IExamQueriesRepository examQueriesRepository)
    : QueryHandler<GetMyAssignedExamsQuery, List<AssignedExamQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<List<AssignedExamQri>>> Handle(GetMyAssignedExamsQuery query)
    {
        var result = await examQueriesRepository.GetMyAssignedExamsAsync(query.UserId);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
