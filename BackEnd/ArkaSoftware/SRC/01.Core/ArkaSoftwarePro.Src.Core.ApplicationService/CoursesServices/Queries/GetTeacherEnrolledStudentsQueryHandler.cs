using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherEnrolledStudents;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetTeacherEnrolledStudentsQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ICourseQueriesRepository courseQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<GetTeacherEnrolledStudentsQuery, List<TeacherEnrolledStudentQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<List<TeacherEnrolledStudentQri>>> Handle(GetTeacherEnrolledStudentsQuery query)
    {
        try
        {
            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(query.TeacherUserId);
            if (!teacherId.HasValue)
                return await ResultAsync(new List<TeacherEnrolledStudentQri>(), ApplicationServiceStatus.Ok);

            var result = await courseQueriesRepository.GetTeacherEnrolledStudentsAsync(teacherId.Value);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
