using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamAttemptForGrading;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Queries;

public class GetExamAttemptForGradingQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IExamQueriesRepository examQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<GetExamAttemptForGradingQuery, ExamAttemptGradingQri>(mafiaOuterService)
{
    public override async Task<QueryResult<ExamAttemptGradingQri>> Handle(GetExamAttemptForGradingQuery query)
    {
        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(query.TeacherUserId);
        if (!teacherId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = await examQueriesRepository.GetAttemptForGradingAsync(query.AttemptId, teacherId.Value);
        if (result == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
