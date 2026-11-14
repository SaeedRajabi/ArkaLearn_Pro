using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Queries.GetMyRemoteAssistSession;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Queries;

public class GetMyRemoteAssistSessionQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository)
    : QueryHandler<GetMyRemoteAssistSessionQuery, RemoteAssistSessionQri?>(outer)
{
    public override async Task<QueryResult<RemoteAssistSessionQri?>> Handle(GetMyRemoteAssistSessionQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync((RemoteAssistSessionQri?)null, ApplicationServiceStatus.ValidationError);

        var session = await repository.GetOpenSessionForUserAsync(query.UserId);
        if (session is null)
            return await ResultAsync((RemoteAssistSessionQri?)null, ApplicationServiceStatus.Ok);

        session.ExpireIfNeeded(DateTime.UtcNow);
        if (session.Status is RemoteAssistSessionStatus.Ended
            or RemoteAssistSessionStatus.Expired
            or RemoteAssistSessionStatus.Rejected)
            return await ResultAsync((RemoteAssistSessionQri?)null, ApplicationServiceStatus.Ok);

        return await ResultAsync((RemoteAssistSessionQri?)RemoteAssistMapper.ToQri(session), ApplicationServiceStatus.Ok);
    }
}
