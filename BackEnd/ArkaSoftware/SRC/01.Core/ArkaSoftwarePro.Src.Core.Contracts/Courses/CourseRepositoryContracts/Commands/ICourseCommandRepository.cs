using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetPendingCourseModeration;
namespace ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands
{
    public interface ICourseCommandRepository : ICommandRepository<Course, long>
    {
        Task SyncTagsAsync(long courseId, IReadOnlyCollection<string> tagNames);

        Task<Course?> GetCourseForEditAsync(long courseId);

        Task<Course?> GetCourseWithCommentsAsync(long courseId);

        Task<bool> DeleteCommentAsync(long courseId, long commentId);

        Task SyncLifecycleTransitionsAsync(long? courseId = null);

        Task UpsertLessonWatchProgressAsync(
            long userId,
            long courseId,
            long lessonId,
            int watchedSeconds,
            int durationSeconds,
            CancellationToken cancellationToken = default);

        Task<List<PendingCourseModerationQri>> GetPendingModerationAsync(CancellationToken cancellationToken = default);
    }
}
