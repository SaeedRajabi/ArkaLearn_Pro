using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamForTaking;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Queries;

public class GetExamForTakingQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IExamQueriesRepository examQueriesRepository)
    : QueryHandler<GetExamForTakingQuery, ExamTakingQri>(mafiaOuterService)
{
    public override async Task<QueryResult<ExamTakingQri>> Handle(GetExamForTakingQuery query)
    {
        var result = await examQueriesRepository.GetExamForTakingAsync(query.ExamId, query.UserId);
        if (result == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
