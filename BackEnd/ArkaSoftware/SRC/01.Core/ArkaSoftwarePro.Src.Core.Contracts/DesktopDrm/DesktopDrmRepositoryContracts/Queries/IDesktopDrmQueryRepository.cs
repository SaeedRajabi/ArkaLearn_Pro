using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpsertTeacherStudentSatisfaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopAnalytics;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopLicenses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopWatermarkPolicy;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopCourseCurriculum;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopEncryptedMedia;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopLicensedCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopPlaybackPackage;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopWatermarkForPlayback;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetStudentDesktopLicenses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetTeacherStudentSatisfaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ListDesktopLicenseDevices;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ValidateDesktopLicense;
using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;

public interface IDesktopDrmQueryRepository : IQueryRepository
{
    Task<bool> IsUserEnrolledInCourseAsync(long userId, long courseId, CancellationToken cancellationToken = default);
    Task<List<DesktopEncryptedMediaQri>> ListAccessibleEncryptedMediaAsync(long userId, CancellationToken cancellationToken = default);
    Task<DesktopPlaybackPackageQri?> GetPlaybackPackageAsync(
        long userId,
        long mediaAssetId,
        string grantToken,
        string? deviceId = null,
        CancellationToken cancellationToken = default);
    Task<DesktopLicenseValidationQri?> ValidateDesktopLicenseAsync(long userId, string licenseKey, CancellationToken cancellationToken = default);
    Task<List<DesktopLicensedCourseQri>> ListDesktopLicensedCoursesAsync(long userId, CancellationToken cancellationToken = default);
    Task<DesktopCourseCurriculumQri?> GetDesktopCourseCurriculumAsync(long userId, long courseId, CancellationToken cancellationToken = default);
    Task<List<StudentDesktopLicenseQri>> ListStudentDesktopLicensesAsync(
        long targetUserId,
        long studentId,
        long? teacherIdFilter,
        CancellationToken cancellationToken = default);

    Task<CourseDesktopWatermarkPolicyQri?> GetCourseWatermarkPolicyAsync(long courseId, CancellationToken cancellationToken = default);
    Task<List<CourseDesktopLicenseEnrollmentQri>> ListCourseDesktopLicensesAsync(long courseId, CancellationToken cancellationToken = default);
    Task<List<DesktopLicenseDeviceBindingQri>> ListDesktopLicenseDevicesAsync(long enrollmentId, CancellationToken cancellationToken = default);
    Task<CourseDesktopAnalyticsQri> GetCourseDesktopAnalyticsAsync(long courseId, CancellationToken cancellationToken = default);
    Task<List<TeacherStudentSatisfactionItemQri>> ListTeacherStudentSatisfactionByCourseAsync(long courseId, CancellationToken cancellationToken = default);
    Task<TeacherStudentSatisfactionItemQri?> GetTeacherStudentSatisfactionByEnrollmentAsync(long enrollmentId, CancellationToken cancellationToken = default);
    Task<DesktopWatermarkForPlaybackQri?> GetDesktopWatermarkForPlaybackAsync(long userId, long courseId, CancellationToken cancellationToken = default);
    Task<HashSet<long>> GetAllowedLessonIdsForEnrollmentAsync(long enrollmentId, CancellationToken cancellationToken = default);
    Task<(DesktopContentAccessMode ContentAccessMode, long EnrollmentId)> GetEnrollmentContentAccessAsync(long userId, long courseId, CancellationToken cancellationToken = default);
}