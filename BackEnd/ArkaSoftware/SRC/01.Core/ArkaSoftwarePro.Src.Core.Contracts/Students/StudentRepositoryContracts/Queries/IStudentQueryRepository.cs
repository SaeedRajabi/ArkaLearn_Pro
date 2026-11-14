using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetCourseEnrollments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetStudentProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.SearchPortalStudents;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries
{
    public interface IStudentQueryRepository : IQueryRepository
    {
        Task<PagedData<CourseEnrollmentQri>> GetCourseEnrollmentsAsync(GetCourseEnrollmentsQuery query);
        Task<PagedData<PortalStudentQri>> SearchPortalStudentsAsync(SearchPortalStudentsQuery query);
        Task<long?> GetStudentIdByUserIdAsync(long userId);
        Task<long?> GetUserIdByStudentIdAsync(long studentId);
        Task<StudentProfileQri?> GetProfileByUserIdAsync(long userId);
    }
}
