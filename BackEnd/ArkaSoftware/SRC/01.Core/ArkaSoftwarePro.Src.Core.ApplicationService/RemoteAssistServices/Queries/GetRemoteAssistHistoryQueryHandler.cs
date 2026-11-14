using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Queries.GetRemoteAssistHistory;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Queries;

public class GetRemoteAssistHistoryQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    ISupportChatQueryRepository chatQueryRepository,
    IUserQueryRepository userQueryRepository)
    : QueryHandler<GetRemoteAssistHistoryQuery, RemoteAssistHistoryPageQri>(outer)
{
    public override async Task<QueryResult<RemoteAssistHistoryPageQri>> Handle(GetRemoteAssistHistoryQuery query)
    {
        if (query.ActorUserId <= 0)
            return await ResultAsync(new RemoteAssistHistoryPageQri(), ApplicationServiceStatus.ValidationError);

        long? ownerFilter = null;
        long? helperFilter = null;

        if (query.ActorIsAdmin)
        {
            ownerFilter = query.StudentUserId is > 0 ? query.StudentUserId : null;
            helperFilter = query.TeacherUserId is > 0 ? query.TeacherUserId : null;
        }
        else if (query.ActorIsTeacher)
        {
            helperFilter = query.ActorUserId;
            if (query.StudentUserId is > 0)
            {
                if (!await chatQueryRepository.IsTeacherAllowedForStudentAsync(query.StudentUserId.Value, query.ActorUserId))
                    return await ResultAsync(new RemoteAssistHistoryPageQri(), ApplicationServiceStatus.InvalidDomainState);
                ownerFilter = query.StudentUserId;
            }
        }
        else
        {
            ownerFilter = query.ActorUserId;
        }

        var (items, total) = await repository.ListHistoryAsync(
            ownerFilter,
            helperFilter,
            query.PageNumber,
            query.PageSize);

        var userIds = items
            .SelectMany(s => new[] { s.RequesterUserId, s.AcceptedByTeacherUserId ?? 0L })
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        var userCache = new Dictionary<long, (string? Name, string? Phone)>();
        foreach (var id in userIds)
        {
            var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = id });
            if (user is null) continue;
            var name = string.IsNullOrWhiteSpace(user.FullName) ? user.UserName : user.FullName;
            userCache[id] = (name, user.PhoneNumber);
        }

        var onlineIds = (await chatQueryRepository.GetOnlineDesktopUsersAsync(500))
            .Select(x => x.UserId)
            .ToHashSet();

        var qris = items.Select(session =>
        {
            userCache.TryGetValue(session.RequesterUserId, out var owner);
            string? helperName = null;
            if (session.AcceptedByTeacherUserId is > 0 &&
                userCache.TryGetValue(session.AcceptedByTeacherUserId.Value, out var helper))
                helperName = helper.Name;

            return RemoteAssistMapper.ToQri(
                session,
                plainPassword: null,
                requesterDisplayName: owner.Name,
                requesterPhoneNumber: owner.Phone,
                helperDisplayName: helperName)
                .WithOnline(onlineIds.Contains(session.RequesterUserId));
        }).ToList();

        return await ResultAsync(new RemoteAssistHistoryPageQri
        {
            PageNumber = Math.Max(1, query.PageNumber),
            PageSize = Math.Clamp(query.PageSize, 1, 100),
            TotalCount = total,
            Items = qris,
        }, ApplicationServiceStatus.Ok);
    }
}
