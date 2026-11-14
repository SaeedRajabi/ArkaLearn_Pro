using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherCourseComments;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetTeacherCourseCommentsQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ICourseQueriesRepository courseQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<GetTeacherCourseCommentsQuery, List<GetTeacherCourseCommentsQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<List<GetTeacherCourseCommentsQri>>> Handle(GetTeacherCourseCommentsQuery query)
    {
        try
        {
            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(query.TeacherUserId);
            if (!teacherId.HasValue)
                return await ResultAsync(new List<GetTeacherCourseCommentsQri>(), ApplicationServiceStatus.Ok);

            var result = await courseQueriesRepository.GetTeacherCourseCommentsAsync(
                teacherId.Value,
                query.CourseId,
                query.OnlyPending);

            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
