using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherStudents;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetTeacherStudentsQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ICourseQueriesRepository courseQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<GetTeacherStudentsQuery, PagedData<TeacherStudentQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<PagedData<TeacherStudentQri>>> Handle(GetTeacherStudentsQuery query)
    {
        try
        {
            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(query.TeacherUserId);
            var pageSize = query.PageSize > 0 ? query.PageSize : 8;
            var result = await courseQueriesRepository.GetTeacherStudentsPagedAsync(
                teacherId,
                query.TeacherUserId,
                query.InputValue,
                query.PageNumber,
                pageSize);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
