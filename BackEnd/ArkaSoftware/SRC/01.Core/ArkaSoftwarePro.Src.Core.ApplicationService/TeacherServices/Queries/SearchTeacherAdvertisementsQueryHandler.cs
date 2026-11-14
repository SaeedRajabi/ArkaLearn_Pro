using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherAdvertisements;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class SearchTeacherAdvertisementsQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ITeacherCommandRepository teacherCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    ISupportChatQueryRepository supportChatQueryRepository)
    : QueryHandler<SearchTeacherAdvertisementsQuery, PagedData<TeacherAdvertisementListItemQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<PagedData<TeacherAdvertisementListItemQri>>> Handle(SearchTeacherAdvertisementsQuery query)
    {
        var result = await teacherCommandRepository.SearchPublicAdvertisementsAsync(query);

        if (result.QueryResult is { Count: > 0 })
        {
            var userIds = result.QueryResult.Select(x => x.UserId).Where(x => x > 0).Distinct().ToList();
            var aggregates = await supportChatQueryRepository.GetTeacherRatingAggregatesAsync(userIds);

            foreach (var item in result.QueryResult)
            {
                if (item.TeacherId <= 0 || item.UserId <= 0)
                    continue;

                var stats = await teacherQueryRepository.GetProfileStatsAsync(item.TeacherId, item.UserId);
                if (stats is not null)
                {
                    item.Points = stats.Points;
                    item.ReviewCount = stats.ReviewCount;
                    item.LikeCount = stats.StudentCount;
                }

                if (aggregates.TryGetValue(item.UserId, out var agg))
                {
                    item.SupportRatingPoints = agg.TotalPoints;
                    item.SupportRatingCount = agg.Count;
                    item.Points += agg.TotalPoints;
                }
            }

            result.QueryResult = result.QueryResult
                .OrderByDescending(x => x.LastBumpedAtUtc ?? DateTime.MinValue)
                .ThenByDescending(x => x.ListingStarLevel)
                .ThenByDescending(x => x.SupportRatingPoints)
                .ThenByDescending(x => x.MemberSinceUtc ?? DateTime.MinValue)
                .ToList();
        }

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
