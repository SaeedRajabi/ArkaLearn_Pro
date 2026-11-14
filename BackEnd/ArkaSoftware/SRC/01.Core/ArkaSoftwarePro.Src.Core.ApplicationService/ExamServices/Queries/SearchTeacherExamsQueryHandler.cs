using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.SearchTeacherExams;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Queries;

public class SearchTeacherExamsQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IExamQueriesRepository examQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<SearchTeacherExamsQuery, PagedData<SearchTeacherExamQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<PagedData<SearchTeacherExamQri>>> Handle(SearchTeacherExamsQuery query)
    {
        if (query.TeacherUserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(query.TeacherUserId);
        if (!teacherId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = await examQueriesRepository.SearchTeacherExamsAsync(query);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
