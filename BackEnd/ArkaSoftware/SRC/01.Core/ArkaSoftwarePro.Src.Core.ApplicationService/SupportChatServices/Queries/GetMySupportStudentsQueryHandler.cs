using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportStudents;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class GetMySupportStudentsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetMySupportStudentsQuery, PagedData<SupportStudentListQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SupportStudentListQri>>> Handle(GetMySupportStudentsQuery query)
    {
        if (query.TeacherUserId <= 0)
            return await ResultAsync(new PagedData<SupportStudentListQri>(), ApplicationServiceStatus.Ok);

        if (query.PageSize <= 0)
            query.PageSize = 5;

        var result = await chatQueryRepository.GetSupportStudentsForTeacherAsync(query);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
