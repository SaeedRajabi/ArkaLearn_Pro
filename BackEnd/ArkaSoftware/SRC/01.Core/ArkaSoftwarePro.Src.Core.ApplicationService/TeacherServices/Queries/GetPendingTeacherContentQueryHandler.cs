using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherContent;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetPendingTeacherContentQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository)
    : QueryHandler<GetPendingTeacherContentQuery, List<PendingTeacherContentQri>>(outer)
{
    public override async Task<QueryResult<List<PendingTeacherContentQri>>> Handle(GetPendingTeacherContentQuery query)
    {
        var result = await teacherCommandRepository.GetPendingContentAsync();
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
