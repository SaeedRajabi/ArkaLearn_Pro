using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherProfiles;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetPendingTeacherProfilesQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<GetPendingTeacherProfilesQuery, List<PendingTeacherProfileQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<List<PendingTeacherProfileQri>>> Handle(GetPendingTeacherProfilesQuery query)
    {
        var result = await teacherQueryRepository.GetPendingProfilesAsync();
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
