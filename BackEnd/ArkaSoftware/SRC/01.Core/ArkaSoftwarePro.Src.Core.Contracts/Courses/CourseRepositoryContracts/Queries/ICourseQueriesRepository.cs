using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllCommentsByCourseId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllPopularCourse;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourseLessonProgress;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourseIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherEnrolledStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchTeacherCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchUserCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCartRecommendations;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries
{
    public interface ICourseQueriesRepository : IQueryRepository
    {
        Task<CourseQri> GetCourseByIdExecuteAsync(GetCourseByIdQuery query);
        Task<CourseQri?> GetCourseBySlugExecuteAsync(GetCourseBySlugQuery query);
        Task<PagedData<SearchCourseQri>?> SearchCourseExecuteAsync(SearchCourseByInputValueQuery query);
        Task<PagedData<SearchCourseQri>?> SearchTeacherCoursesExecuteAsync(SearchTeacherCoursesQuery query);
        Task<PagedData<GetAllPopularCourseQri>?> GetAllPopularCourseExecuteAsync(GetAllPopularCourseQuery query);
        Task<PagedData<GetAllCommentsByCourseIdQri>> GetAllCourseCommentsById(GetAllCommentsByCourseIdQuery query);
        Task<List<GetMyCoursesQri>> GetMyCoursesAsync(GetMyCoursesQuery query);
        Task<List<TeacherEnrolledStudentQri>> GetTeacherEnrolledStudentsAsync(long teacherId);
        Task<PagedData<TeacherStudentQri>> GetTeacherStudentsPagedAsync(
            long? teacherId,
            long teacherUserId,
            string? searchTerm,
            int pageNumber,
            int pageSize);
        Task<List<GetTeacherCourseCommentsQri>> GetTeacherCourseCommentsAsync(long teacherId, long? courseId, bool? onlyPending);
        Task<PagedData<SearchUserCourseCommentQri>> SearchUserCourseCommentsAsync(SearchUserCourseCommentsQuery query);
        Task<List<long>> GetMyFavoriteCourseIdsAsync(GetMyFavoriteCourseIdsQuery query);
        Task<List<GetMyFavoriteCourseQri>> GetMyFavoriteCoursesAsync(GetMyFavoriteCoursesQuery query);
        Task<bool> HasActiveEnrollmentAsync(long userId, long courseId);
        Task<long?> GetCourseTeacherIdAsync(long courseId);
        Task<bool> IsPortalUserInTeacherScopeAsync(long teacherUserId, long portalUserId);
        Task<long?> FindManagedRoomStudentIdByPortalUserIdAsync(long portalUserId);
        Task<CourseLessonVideoAccessQri?> GetLessonVideoAccessAsync(long lessonId);
        Task<List<CourseLessonVideoAccessQri>> GetCourseLessonVideosAsync(long courseId);
        Task<CourseDeliveryMode> GetCourseDeliveryModeAsync(long courseId);
        Task<List<LessonWatchProgressQri>> GetMyCourseLessonProgressAsync(long userId, long courseId);
        Task<CartRecommendationsQri> GetCartRecommendationsAsync(
            IReadOnlyList<long> courseIds,
            long? userId,
            CancellationToken cancellationToken = default);
    }
}
