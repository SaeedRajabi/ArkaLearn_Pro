using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetStudentSupportTeachers;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class GetStudentSupportTeachersQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetStudentSupportTeachersQuery, List<StudentSupportTeacherQri>>(outer)
{
    public override async Task<QueryResult<List<StudentSupportTeacherQri>>> Handle(GetStudentSupportTeachersQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        var teachers = await chatQueryRepository.GetStudentTeachersAsync(query.UserId);
        return await ResultAsync(teachers, ApplicationServiceStatus.Ok);
    }
}
