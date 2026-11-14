using ArkaSoftwarePro.Src.Core.Domain.UserActivityAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.GetUserActivityTimeline;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.SearchUserActivitySubjects;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.UserActivity;

public interface IUserActivityRepository
{
    Task BulkInsertAsync(IReadOnlyList<UserActivityEvent> events, CancellationToken cancellationToken = default);
    Task<PagedData<UserActivitySubjectListItemQri>> SearchSubjectsAsync(
        SearchUserActivitySubjectsQuery query,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserActivityTimelineItemQri>> GetTimelineAsync(
        GetUserActivityTimelineQuery query,
        CancellationToken cancellationToken = default);
    Task<DateTime?> GetLastActivityDayUtcAsync(string subjectKey, CancellationToken cancellationToken = default);
}
