using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetDesktopUserPresence;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class GetDesktopUserPresenceQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetDesktopUserPresenceQuery, DesktopUserPresenceQri>(outer)
{
    public override async Task<QueryResult<DesktopUserPresenceQri>> Handle(GetDesktopUserPresenceQuery query)
    {
        if (query.TargetUserId <= 0)
            return await ResultAsync(new DesktopUserPresenceQri(), ApplicationServiceStatus.ValidationError);

        var status = await chatQueryRepository.GetDesktopPresenceStatusAsync(query.TargetUserId);
        var normalized = string.IsNullOrWhiteSpace(status) ? DesktopPresenceStatus.Offline : status;
        return await ResultAsync(new DesktopUserPresenceQri
        {
            UserId = query.TargetUserId,
            Status = normalized,
            IsOnline = normalized == DesktopPresenceStatus.Online,
            LastSeenAtUtc = DateTime.UtcNow,
        }, ApplicationServiceStatus.Ok);
    }
}
