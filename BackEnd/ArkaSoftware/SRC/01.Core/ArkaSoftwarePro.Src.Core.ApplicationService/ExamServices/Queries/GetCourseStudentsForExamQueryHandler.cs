using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetCourseStudentsForExam;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Queries;

public class GetCourseStudentsForExamQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IExamQueriesRepository examQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<GetCourseStudentsForExamQuery, List<CourseStudentForExamQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<List<CourseStudentForExamQri>>> Handle(GetCourseStudentsForExamQuery query)
    {
        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(query.TeacherUserId);
        if (!teacherId.HasValue)
            return await ResultAsync([], ApplicationServiceStatus.NotFound);

        var result = await examQueriesRepository.GetCourseStudentsAsync(query.CourseId, teacherId.Value);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
