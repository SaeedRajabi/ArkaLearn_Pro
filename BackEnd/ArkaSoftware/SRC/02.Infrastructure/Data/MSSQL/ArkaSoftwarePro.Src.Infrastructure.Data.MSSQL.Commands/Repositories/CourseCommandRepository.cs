using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetPendingCourseModeration;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class CourseCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Course, ArkaSoftwareCommandDbContext>(dbContext), ICourseCommandRepository
    {
        public async Task SyncTagsAsync(long courseId, IReadOnlyCollection<string> tagNames)
        {
            var normalizedNames = NormalizeTagNames(tagNames);
            var existingCourseTags = await _dbContext.Tags
                .Where(x => EF.Property<long?>(x, "CourseId") == courseId)
                .ToListAsync();

            foreach (var tag in existingCourseTags)
                _dbContext.Entry(tag).Property("CourseId").CurrentValue = null;

            foreach (var name in normalizedNames)
            {
                var tag = await ResolveReusableTagAsync(name, "CourseId", courseId);
                _dbContext.Entry(tag).Property("CourseId").CurrentValue = courseId;
            }
        }

        private async Task<Tag> ResolveReusableTagAsync(string tagName, string ownerPropertyName, long ownerId)
        {
            var tags = await _dbContext.Tags.ToListAsync();
            var tag = tags.FirstOrDefault(x =>
                string.Equals(x.TagName.Value, tagName, StringComparison.OrdinalIgnoreCase) &&
                (_dbContext.Entry(x).Property<long?>(ownerPropertyName).CurrentValue == null ||
                 _dbContext.Entry(x).Property<long?>(ownerPropertyName).CurrentValue == ownerId));

            if (tag != null)
                return tag;

            tag = new Tag(new TagName(tagName));
            await _dbContext.Tags.AddAsync(tag);
            return tag;
        }

        private static List<string> NormalizeTagNames(IEnumerable<string?> tagNames)
        {
            return tagNames
                .Select(x => (x ?? string.Empty).Trim().TrimStart('#'))
                .Where(x => x.Length >= 2)
                .Select(x => x.Length > 100 ? x[..100].Trim() : x)
                .Where(x => x.Length >= 2)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public Task<Course?> GetCourseForEditAsync(long courseId) =>
            _dbContext.Courses
                .Include(c => c.CourseSessions)
                .ThenInclude(s => s.CourseLessons)
                .Include(c => c.CourseFaqs)
                .Include(c => c.CourseDependencies)
                .Include(c => c.CourseVideos)
                .Include(c => c.InstallmentPlans)
                .FirstOrDefaultAsync(c => c.Id == courseId);

        public Task<Course?> GetCourseWithCommentsAsync(long courseId) =>
            _dbContext.Courses
                .Include(c => c.CourseComments)
                .FirstOrDefaultAsync(c => c.Id == courseId);

        public async Task<bool> DeleteCommentAsync(long courseId, long commentId)
        {
            var comments = await _dbContext.Set<CourseComment>()
                .Where(x => x.CourseId == courseId)
                .ToListAsync();

            var byParent = comments
                .Where(x => x.ParentId.HasValue)
                .GroupBy(x => x.ParentId!.Value)
                .ToDictionary(x => x.Key, x => x.ToList());

            var idsToDelete = new HashSet<long>();
            var stack = new Stack<long>();
            stack.Push(commentId);

            while (stack.Count > 0)
            {
                var current = stack.Pop();
                if (!idsToDelete.Add(current))
                    continue;

                if (byParent.TryGetValue(current, out var replies))
                {
                    foreach (var reply in replies)
                        stack.Push(reply.Id);
                }
            }

            var targetComments = comments.Where(x => idsToDelete.Contains(x.Id)).ToList();
            if (targetComments.Count == 0)
                return false;

            _dbContext.Set<CourseComment>().RemoveRange(targetComments);
            return true;
        }

        public async Task SyncLifecycleTransitionsAsync(long? courseId = null)
        {
            var utcNow = DateTime.UtcNow;
            var query = _dbContext.Courses.AsQueryable();
            if (courseId.HasValue)
                query = query.Where(c => c.Id == courseId.Value);

            var courses = await query.ToListAsync();
            var changed = false;
            foreach (var course in courses)
            {
                if (course.TrySyncLifecycleFromSchedule(utcNow, out _))
                    changed = true;
            }

            if (changed)
                await _dbContext.SaveChangesAsync();
        }

        public async Task UpsertLessonWatchProgressAsync(
            long userId,
            long courseId,
            long lessonId,
            int watchedSeconds,
            int durationSeconds,
            CancellationToken cancellationToken = default)
        {
            var existing = await _dbContext.CourseLessonWatchProgress
                .FirstOrDefaultAsync(x => x.UserId == userId && x.LessonId == lessonId, cancellationToken);

            if (existing == null)
            {
                existing = CourseLessonWatchProgress.Create(userId, courseId, lessonId);
                await _dbContext.CourseLessonWatchProgress.AddAsync(existing, cancellationToken);
            }

            existing.UpdateProgress(watchedSeconds, durationSeconds);
        }

        public async Task<List<PendingCourseModerationQri>> GetPendingModerationAsync(CancellationToken cancellationToken = default)
        {
            var items = new List<PendingCourseModerationQri>();

            var pendingCourses = await _dbContext.Courses
                .AsNoTracking()
                .Where(c => !c.IsDelete && c.IsPublish && c.ModerationStatus == TeacherApprovalStatus.Pending)
                .Include(c => c.Teacher!)
                    .ThenInclude(t => t!.User)
                .ToListAsync(cancellationToken);

            items.AddRange(pendingCourses.Select(c => MapPendingCourse(c)));

            var pendingLessons = await _dbContext.Set<CourseLesson>()
                .AsNoTracking()
                .Where(l => !l.IsDelete
                    && l.IsPublished
                    && l.VideoModerationStatus == TeacherApprovalStatus.Pending
                    && l.VideoPath != null)
                .Include(l => l.CourseSection!)
                    .ThenInclude(s => s!.Course!)
                        .ThenInclude(c => c!.Teacher!)
                            .ThenInclude(t => t!.User)
                .ToListAsync(cancellationToken);

            items.AddRange(pendingLessons.Select(MapPendingLesson));
            return items.OrderByDescending(i => i.SubmittedAtUtc).ToList();
        }

        private static PendingCourseModerationQri MapPendingCourse(Course course)
        {
            var teacher = course.Teacher;
            var user = teacher?.User;
            return new PendingCourseModerationQri
            {
                ItemType = "course",
                CourseId = course.Id,
                TeacherId = teacher?.Id ?? 0,
                TeacherUserId = teacher?.UserId,
                TeacherDisplayName = FormatDisplayName(user),
                TeacherUserName = user?.UserName?.Value ?? string.Empty,
                Title = course.Title?.Value ?? string.Empty,
                CourseTitle = course.Title?.Value ?? string.Empty,
                ThumbnailUrl = course.TitleImage?.ImageURL,
                SubmittedAtUtc = course.ModerationSubmittedAtUtc,
            };
        }

        private static PendingCourseModerationQri MapPendingLesson(CourseLesson lesson)
        {
            var course = lesson.CourseSection?.Course;
            var teacher = course?.Teacher;
            var user = teacher?.User;
            return new PendingCourseModerationQri
            {
                ItemType = "lesson_video",
                CourseId = course?.Id ?? 0,
                LessonId = lesson.Id,
                TeacherId = teacher?.Id ?? 0,
                TeacherUserId = teacher?.UserId,
                TeacherDisplayName = FormatDisplayName(user),
                TeacherUserName = user?.UserName?.Value ?? string.Empty,
                Title = lesson.LessonTitle?.Value ?? string.Empty,
                CourseTitle = course?.Title?.Value ?? string.Empty,
                PreviewUrl = lesson.VideoPath?.Value,
                SubmittedAtUtc = lesson.VideoSubmittedAtUtc,
            };
        }

        private static string FormatDisplayName(ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities.User? user)
        {
            if (user?.UserFullName == null)
                return string.Empty;
            return $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim();
        }
    }
}
