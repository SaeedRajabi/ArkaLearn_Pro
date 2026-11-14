using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherProfiles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherTeachingCategories;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeachers;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries
{
    public interface ITeacherQueryRepository:IQueryRepository
    {
        Task<long?> GetTeacherIdByUserIdAsync(long userId);
        Task<long?> GetUserIdByTeacherIdAsync(long teacherId);
        Task<TeacherProfileQri?> GetProfileAsync(GetTeacherProfileQuery query, bool includeUnapproved = false);
        Task<TeacherProfileStatsQri?> GetProfileStatsAsync(long teacherId, long userId);
        Task<PagedData<SearchTeacherQri>> SearchTeachersAsync(SearchTeachersQuery query);
        Task<List<TeacherTeachingCategoryItemQri>> GetTeachingCategoriesAsync();
        Task<List<PendingTeacherProfileQri>> GetPendingProfilesAsync();
        Task<bool> IsUserFollowingTeacherAsync(long followerUserId, long teacherId);
        Task<int> GetTeacherFollowerCountAsync(long teacherId);
        Task<HashSet<long>> GetFollowedTeacherIdsAsync(long followerUserId, IEnumerable<long> teacherIds);
    }

    public class TeacherProfileStatsQri
    {
        public int PublishedCourseCount { get; set; }
        public int PublishedArticleCount { get; set; }
        public int Points { get; set; }
        public int StudentCount { get; set; }
        public int ReviewCount { get; set; }
    }
}
