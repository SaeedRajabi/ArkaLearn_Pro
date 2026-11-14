using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.DesktopDrm.Repositories;

public class DesktopDrmCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<OfflinePlaybackGrant, ArkaSoftwareCommandDbContext>(dbContext), IDesktopDrmCommandRepository
{
    public Task<DesktopAppLicense?> GetActiveLicenseAsync(long userId, CancellationToken cancellationToken = default) =>
        _dbContext.DesktopAppLicenses
            .Where(x => x.UserId == userId && !x.IsDelete && x.Status == DesktopLicenseStatus.Active)
            .OrderByDescending(x => x.IssuedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<OfflinePlaybackGrant?> GetActiveGrantAsync(long userId, long courseId, CancellationToken cancellationToken = default) =>
        _dbContext.OfflinePlaybackGrants
            .Where(x => x.UserId == userId && x.CourseId == courseId && !x.IsDelete && x.RevokedAtUtc == null)
            .OrderByDescending(x => x.ExpiresAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<OfflinePlaybackGrant?> GetActiveGrantForDeviceAsync(
        long userId,
        long courseId,
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        var normalized = deviceId.Trim();
        return _dbContext.OfflinePlaybackGrants
            .Where(x => x.UserId == userId
                        && x.CourseId == courseId
                        && !x.IsDelete
                        && x.RevokedAtUtc == null
                        && x.DeviceId == normalized)
            .OrderByDescending(x => x.ExpiresAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<List<OfflinePlaybackGrant>> ListActiveGrantsForCourseAsync(
        long userId,
        long courseId,
        CancellationToken cancellationToken = default) =>
        _dbContext.OfflinePlaybackGrants
            .Where(x => x.UserId == userId
                        && x.CourseId == courseId
                        && !x.IsDelete
                        && x.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

    public Task<OfflinePlaybackGrant?> GetGrantByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default) =>
        _dbContext.OfflinePlaybackGrants
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash && !x.IsDelete, cancellationToken);

    public async Task InsertLicenseAsync(DesktopAppLicense license, CancellationToken cancellationToken = default)
    {
        await _dbContext.DesktopAppLicenses.AddAsync(license, cancellationToken);
    }

    public async Task InsertContentKeyAsync(MediaContentKey contentKey, CancellationToken cancellationToken = default)
    {
        await _dbContext.MediaContentKeys.AddAsync(contentKey, cancellationToken);
    }

    public Task<MediaContentKey?> GetContentKeyAsync(string keyId, CancellationToken cancellationToken = default) =>
        _dbContext.MediaContentKeys.FirstOrDefaultAsync(x => x.KeyId == keyId && !x.IsDelete, cancellationToken);

    public Task<DesktopDeviceRegistration?> GetDeviceRegistrationAsync(long userId, string deviceId, CancellationToken cancellationToken = default)
    {
        var normalized = deviceId.Trim();
        return _dbContext.DesktopDeviceRegistrations
            .FirstOrDefaultAsync(x => !x.IsDelete && x.UserId == userId && x.DeviceId == normalized, cancellationToken);
    }

    public Task<DesktopDeviceRegistration?> GetDeviceRegistrationByIdAsync(long id, CancellationToken cancellationToken = default)
        => _dbContext.DesktopDeviceRegistrations.FirstOrDefaultAsync(x => !x.IsDelete && x.Id == id, cancellationToken);

    public Task<DesktopDeviceRegistration?> GetActiveLoginRegistrationAsync(long userId, CancellationToken cancellationToken = default) =>
        _dbContext.DesktopDeviceRegistrations
            .Where(x => !x.IsDelete && x.UserId == userId && x.HasActiveLogin)
            .OrderByDescending(x => x.ActiveLoginAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<List<DesktopDeviceRegistration>> ListDeviceRegistrationsAsync(long? userId, int take, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.DesktopDeviceRegistrations.AsNoTracking().Where(x => !x.IsDelete);
        if (userId is > 0)
            query = query.Where(x => x.UserId == userId.Value);

        return query
            .OrderByDescending(x => x.LastHeartbeatAtUtc)
            .Take(take <= 0 ? 100 : Math.Min(take, 500))
            .ToListAsync(cancellationToken);
    }

    public async Task InsertDeviceRegistrationAsync(DesktopDeviceRegistration registration, CancellationToken cancellationToken = default)
    {
        await _dbContext.DesktopDeviceRegistrations.AddAsync(registration, cancellationToken);
    }

    public async Task DeactivateOtherActiveLoginsAsync(
        long userId,
        string keepDeviceId,
        CancellationToken cancellationToken = default)
    {
        var normalized = keepDeviceId.Trim();
        var others = await _dbContext.DesktopDeviceRegistrations
            .Where(x => !x.IsDelete && x.UserId == userId && x.HasActiveLogin && x.DeviceId != normalized)
            .ToListAsync(cancellationToken);

        foreach (var other in others)
            other.DeactivateLogin();
    }

    public async Task DeactivateAllActiveLoginsAsync(long userId, CancellationToken cancellationToken = default)
    {
        var active = await _dbContext.DesktopDeviceRegistrations
            .Where(x => !x.IsDelete && x.UserId == userId && x.HasActiveLogin)
            .ToListAsync(cancellationToken);

        foreach (var registration in active)
            registration.DeactivateLogin();
    }

    public Task<DesktopAccessBlock?> GetActiveUserAccessBlockAsync(long userId, CancellationToken cancellationToken = default)
        => _dbContext.DesktopAccessBlocks
            .Where(x => !x.IsDelete && x.UserId == userId && x.UnblockedAtUtc == null)
            .OrderByDescending(x => x.BlockedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<DesktopAccessBlock?> GetAccessBlockByIdAsync(long id, CancellationToken cancellationToken = default)
        => _dbContext.DesktopAccessBlocks.FirstOrDefaultAsync(x => !x.IsDelete && x.Id == id, cancellationToken);

    public Task<List<DesktopAccessBlock>> ListAccessBlocksAsync(long? userId, bool activeOnly, int take, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.DesktopAccessBlocks.AsNoTracking().Where(x => !x.IsDelete);
        if (userId is > 0)
            query = query.Where(x => x.UserId == userId.Value);
        if (activeOnly)
            query = query.Where(x => x.UnblockedAtUtc == null);

        return query
            .OrderByDescending(x => x.BlockedAtUtc)
            .Take(take <= 0 ? 100 : Math.Min(take, 500))
            .ToListAsync(cancellationToken);
    }

    public async Task InsertAccessBlockAsync(DesktopAccessBlock block, CancellationToken cancellationToken = default)
    {
        await _dbContext.DesktopAccessBlocks.AddAsync(block, cancellationToken);
    }

    public Task<CourseDesktopWatermarkPolicy?> GetWatermarkPolicyByCourseIdAsync(long courseId, CancellationToken cancellationToken = default) =>
        _dbContext.CourseDesktopWatermarkPolicies
            .FirstOrDefaultAsync(x => !x.IsDelete && x.CourseId == courseId, cancellationToken);

    public async Task InsertWatermarkPolicyAsync(CourseDesktopWatermarkPolicy policy, CancellationToken cancellationToken = default)
    {
        await _dbContext.CourseDesktopWatermarkPolicies.AddAsync(policy, cancellationToken);
    }

    public Task<List<DesktopLicenseDeviceBinding>> ListActiveDeviceBindingsAsync(long enrollmentId, CancellationToken cancellationToken = default) =>
        _dbContext.DesktopLicenseDeviceBindings
            .Where(x => !x.IsDelete && x.EnrollmentId == enrollmentId && x.RevokedAtUtc == null)
            .OrderByDescending(x => x.ActivatedAtUtc)
            .ToListAsync(cancellationToken);

    public Task<List<DesktopLicenseDeviceBinding>> ListDeviceBindingsAsync(long enrollmentId, CancellationToken cancellationToken = default) =>
        _dbContext.DesktopLicenseDeviceBindings
            .Where(x => !x.IsDelete && x.EnrollmentId == enrollmentId)
            .OrderByDescending(x => x.ActivatedAtUtc)
            .ToListAsync(cancellationToken);

    public Task<DesktopLicenseDeviceBinding?> GetActiveDeviceBindingAsync(
        long enrollmentId,
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        var normalized = deviceId.Trim();
        return _dbContext.DesktopLicenseDeviceBindings
            .FirstOrDefaultAsync(
                x => !x.IsDelete
                    && x.EnrollmentId == enrollmentId
                    && x.RevokedAtUtc == null
                    && x.DeviceId == normalized,
                cancellationToken);
    }

    public Task<int> CountActiveDeviceBindingsAsync(long enrollmentId, CancellationToken cancellationToken = default) =>
        _dbContext.DesktopLicenseDeviceBindings
            .CountAsync(x => !x.IsDelete && x.EnrollmentId == enrollmentId && x.RevokedAtUtc == null, cancellationToken);

    public async Task InsertDeviceBindingAsync(DesktopLicenseDeviceBinding binding, CancellationToken cancellationToken = default)
    {
        await _dbContext.DesktopLicenseDeviceBindings.AddAsync(binding, cancellationToken);
    }

    public async Task ReplaceLessonAccessAsync(long enrollmentId, IEnumerable<long> lessonIds, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.DesktopLicenseLessonAccesses
            .Where(x => !x.IsDelete && x.EnrollmentId == enrollmentId)
            .ToListAsync(cancellationToken);

        _dbContext.DesktopLicenseLessonAccesses.RemoveRange(existing);

        var distinctIds = lessonIds.Where(id => id > 0).Distinct().ToList();
        foreach (var lessonId in distinctIds)
        {
            await _dbContext.DesktopLicenseLessonAccesses.AddAsync(
                DesktopLicenseLessonAccess.Grant(enrollmentId, lessonId),
                cancellationToken);
        }
    }

    public async Task InsertPlaybackEventAsync(DesktopPlaybackEvent playbackEvent, CancellationToken cancellationToken = default)
    {
        await _dbContext.DesktopPlaybackEvents.AddAsync(playbackEvent, cancellationToken);
    }

    public Task<TeacherStudentSatisfaction?> GetTeacherStudentSatisfactionAsync(
        long enrollmentId,
        long teacherUserId,
        CancellationToken cancellationToken = default) =>
        _dbContext.TeacherStudentRatings
            .FirstOrDefaultAsync(
                x => !x.IsDelete && x.EnrollmentId == enrollmentId && x.TeacherUserId == teacherUserId,
                cancellationToken);

    public async Task InsertTeacherStudentSatisfactionAsync(TeacherStudentSatisfaction satisfaction, CancellationToken cancellationToken = default)
    {
        await _dbContext.TeacherStudentRatings.AddAsync(satisfaction, cancellationToken);
    }
}
