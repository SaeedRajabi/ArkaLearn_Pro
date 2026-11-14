using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;

public interface IDesktopDrmCommandRepository : ICommandRepository<OfflinePlaybackGrant, long>
{
    Task<DesktopAppLicense?> GetActiveLicenseAsync(long userId, CancellationToken cancellationToken = default);
    Task<OfflinePlaybackGrant?> GetActiveGrantAsync(long userId, long courseId, CancellationToken cancellationToken = default);
    Task<OfflinePlaybackGrant?> GetActiveGrantForDeviceAsync(long userId, long courseId, string deviceId, CancellationToken cancellationToken = default);
    Task<List<OfflinePlaybackGrant>> ListActiveGrantsForCourseAsync(long userId, long courseId, CancellationToken cancellationToken = default);
    Task<OfflinePlaybackGrant?> GetGrantByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task InsertLicenseAsync(DesktopAppLicense license, CancellationToken cancellationToken = default);
    Task InsertContentKeyAsync(MediaContentKey contentKey, CancellationToken cancellationToken = default);
    Task<MediaContentKey?> GetContentKeyAsync(string keyId, CancellationToken cancellationToken = default);

    Task<DesktopDeviceRegistration?> GetDeviceRegistrationAsync(long userId, string deviceId, CancellationToken cancellationToken = default);
    Task<DesktopDeviceRegistration?> GetDeviceRegistrationByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<DesktopDeviceRegistration?> GetActiveLoginRegistrationAsync(long userId, CancellationToken cancellationToken = default);
    Task<List<DesktopDeviceRegistration>> ListDeviceRegistrationsAsync(long? userId, int take, CancellationToken cancellationToken = default);
    Task InsertDeviceRegistrationAsync(DesktopDeviceRegistration registration, CancellationToken cancellationToken = default);
    Task DeactivateOtherActiveLoginsAsync(long userId, string keepDeviceId, CancellationToken cancellationToken = default);
    Task DeactivateAllActiveLoginsAsync(long userId, CancellationToken cancellationToken = default);

    Task<DesktopAccessBlock?> GetActiveUserAccessBlockAsync(long userId, CancellationToken cancellationToken = default);
    Task<DesktopAccessBlock?> GetAccessBlockByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<List<DesktopAccessBlock>> ListAccessBlocksAsync(long? userId, bool activeOnly, int take, CancellationToken cancellationToken = default);
    Task InsertAccessBlockAsync(DesktopAccessBlock block, CancellationToken cancellationToken = default);

    Task<CourseDesktopWatermarkPolicy?> GetWatermarkPolicyByCourseIdAsync(long courseId, CancellationToken cancellationToken = default);
    Task InsertWatermarkPolicyAsync(CourseDesktopWatermarkPolicy policy, CancellationToken cancellationToken = default);

    Task<List<DesktopLicenseDeviceBinding>> ListActiveDeviceBindingsAsync(long enrollmentId, CancellationToken cancellationToken = default);
    Task<List<DesktopLicenseDeviceBinding>> ListDeviceBindingsAsync(long enrollmentId, CancellationToken cancellationToken = default);
    Task<DesktopLicenseDeviceBinding?> GetActiveDeviceBindingAsync(long enrollmentId, string deviceId, CancellationToken cancellationToken = default);
    Task<int> CountActiveDeviceBindingsAsync(long enrollmentId, CancellationToken cancellationToken = default);
    Task InsertDeviceBindingAsync(DesktopLicenseDeviceBinding binding, CancellationToken cancellationToken = default);
    Task ReplaceLessonAccessAsync(long enrollmentId, IEnumerable<long> lessonIds, CancellationToken cancellationToken = default);

    Task InsertPlaybackEventAsync(DesktopPlaybackEvent playbackEvent, CancellationToken cancellationToken = default);

    Task<TeacherStudentSatisfaction?> GetTeacherStudentSatisfactionAsync(long enrollmentId, long teacherUserId, CancellationToken cancellationToken = default);
    Task InsertTeacherStudentSatisfactionAsync(TeacherStudentSatisfaction satisfaction, CancellationToken cancellationToken = default);
}
