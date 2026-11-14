using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Queries.GetPendingRemoteAssistSessions;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Queries;

public class GetPendingRemoteAssistSessionsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetPendingRemoteAssistSessionsQuery, List<RemoteAssistSessionQri>>(outer)
{
    public override async Task<QueryResult<List<RemoteAssistSessionQri>>> Handle(GetPendingRemoteAssistSessionsQuery query)
    {
        if (query.TeacherUserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var now = DateTime.UtcNow;
        var pending = await repository.ListPendingAsync();
        var allowed = new List<RemoteAssistSessionQri>();

        foreach (var session in pending)
        {
            session.ExpireIfNeeded(now);
            if (session.Status != RemoteAssistSessionStatus.Pending || now >= session.CodeExpiresAtUtc)
                continue;

            if (!await chatQueryRepository.IsTeacherAllowedForStudentAsync(session.RequesterUserId, query.TeacherUserId))
                continue;

            allowed.Add(RemoteAssistMapper.ToQri(session));
        }

        return await ResultAsync(allowed, ApplicationServiceStatus.Ok);
    }
}
