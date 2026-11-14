using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeachers;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class SearchTeachersQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ITeacherQueryRepository teacherQueryRepository,
    ISupportChatQueryRepository supportChatQueryRepository)
    : QueryHandler<SearchTeachersQuery, PagedData<SearchTeacherQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<PagedData<SearchTeacherQri>>> Handle(SearchTeachersQuery query)
    {
        var result = await teacherQueryRepository.SearchTeachersAsync(query);
        if (result.QueryResult is not { Count: > 0 })
            return await ResultAsync(result, ApplicationServiceStatus.Ok);

        var userIds = result.QueryResult.Select(x => x.UserId).Where(x => x > 0).Distinct().ToList();
        var aggregates = await supportChatQueryRepository.GetTeacherRatingAggregatesAsync(userIds);

        HashSet<long> followedTeacherIds = [];
        if (query.ViewerUserId is > 0)
        {
            var teacherIds = result.QueryResult.Select(x => x.TeacherId).Where(x => x > 0);
            followedTeacherIds = await teacherQueryRepository.GetFollowedTeacherIdsAsync(query.ViewerUserId.Value, teacherIds);
        }

        foreach (var item in result.QueryResult)
        {
            if (item.UserId > 0 && aggregates.TryGetValue(item.UserId, out var agg))
            {
                item.SupportRatingPoints = agg.TotalPoints;
                item.SupportRatingCount = agg.Count;
                item.Points += agg.TotalPoints;
            }

            if (query.ViewerUserId is > 0 && item.TeacherId > 0 && item.UserId != query.ViewerUserId)
                item.IsFollowing = followedTeacherIds.Contains(item.TeacherId);
        }

        result.QueryResult = result.QueryResult
            .OrderByDescending(x => x.SupportRatingPoints)
            .ThenByDescending(x => x.PublishedCourseCount)
            .ToList();

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
