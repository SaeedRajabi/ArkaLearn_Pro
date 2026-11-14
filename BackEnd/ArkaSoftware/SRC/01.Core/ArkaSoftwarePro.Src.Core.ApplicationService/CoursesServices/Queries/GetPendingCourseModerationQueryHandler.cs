using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetPendingCourseModeration;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetPendingCourseModerationQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository)
    : QueryHandler<GetPendingCourseModerationQuery, List<PendingCourseModerationQri>>(outer)
{
    public override async Task<QueryResult<List<PendingCourseModerationQri>>> Handle(GetPendingCourseModerationQuery query)
    {
        var items = await courseCommandRepository.GetPendingModerationAsync();
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}
