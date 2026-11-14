using System.Security.Cryptography;
using System.Text;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopAnalytics;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopLicenses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopWatermarkPolicy;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopWatermarkForPlayback;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetTeacherStudentSatisfaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ListDesktopLicenseDevices;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopCourseCurriculum;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopEncryptedMedia;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopLicensedCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopPlaybackPackage;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetStudentDesktopLicenses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ValidateDesktopLicense;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class DesktopDrmQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IDesktopDrmQueryRepository
{
    public Task<bool> IsUserEnrolledInCourseAsync(long userId, long courseId, CancellationToken cancellationToken = default) =>
        _dbContext.Enrollments.AsNoTracking()
            .Join(
                _dbContext.Students.AsNoTracking(),
                enrollment => enrollment.StudentId,
                student => student.StudentId,
                (enrollment, student) => new { enrollment, student })
            .AnyAsync(
                x => x.student.UserId == userId
                    && x.enrollment.CourseId == courseId
                    && x.enrollment.IsActive,
                cancellationToken);

    public async Task<List<DesktopEncryptedMediaQri>> ListAccessibleEncryptedMediaAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var owned = await _dbContext.MediaAssets.AsNoTracking()
            .Where(x => x.OwnerUserId == userId && x.IsEncrypted && x.EncryptionStatus == (int)EncryptedMediaStatus.Ready)
            .Select(x => new DesktopEncryptedMediaQri
            {
                MediaAssetId = x.Id,
                Title = x.Title ?? x.OriginalFileName,
                OriginalFileName = x.OriginalFileName,
                MimeType = x.MimeType,
                FileSizeBytes = x.FileSizeBytes,
                EncryptedFileUrl = x.EncryptedFileUrl,
                ContentKeyId = x.ContentKeyId,
                EncryptionIvBase64 = x.EncryptionIvBase64,
                ContentChecksumSha256 = x.ContentChecksumSha256,
            })
            .ToListAsync(cancellationToken);

        var enrolledCourseIds = await _dbContext.Enrollments.AsNoTracking()
            .Join(
                _dbContext.Students.AsNoTracking(),
                enrollment => enrollment.StudentId,
                student => student.StudentId,
                (enrollment, student) => new { enrollment, student })
            .Where(x => x.student.UserId == userId && x.enrollment.IsActive)
            .Select(x => x.enrollment.CourseId)
            .ToListAsync(cancellationToken);

        if (enrolledCourseIds.Count == 0)
            return owned;

        var teacherIds = await _dbContext.Courses.AsNoTracking()
            .Where(c => enrolledCourseIds.Contains(c.CourseId))
            .Select(c => new { c.CourseId, c.TeacherId, c.Title })
            .ToListAsync(cancellationToken);

        var teacherUserIds = await _dbContext.Teachers.AsNoTracking()
            .Where(t => teacherIds.Where(x => x.TeacherId.HasValue).Select(x => x.TeacherId!.Value).Contains(t.Id))
            .Select(t => new { t.Id, t.UserId })
            .ToListAsync(cancellationToken);

        var teacherMap = teacherUserIds.ToDictionary(x => x.Id, x => x.UserId);
        var courseMap = teacherIds.ToDictionary(x => x.CourseId, x => x.Title);

        var accessibleOwnerIds = teacherIds
            .Where(x => x.TeacherId.HasValue && teacherMap.ContainsKey(x.TeacherId.Value))
            .Select(x => teacherMap[x.TeacherId!.Value])
            .Distinct()
            .ToList();

        var shared = await _dbContext.MediaAssets.AsNoTracking()
            .Where(x => accessibleOwnerIds.Contains(x.OwnerUserId)
                && x.IsEncrypted
                && x.EncryptionStatus == (int)EncryptedMediaStatus.Ready)
            .Select(x => new DesktopEncryptedMediaQri
            {
                MediaAssetId = x.Id,
                Title = x.Title ?? x.OriginalFileName,
                OriginalFileName = x.OriginalFileName,
                MimeType = x.MimeType,
                FileSizeBytes = x.FileSizeBytes,
                EncryptedFileUrl = x.EncryptedFileUrl,
                ContentKeyId = x.ContentKeyId,
                EncryptionIvBase64 = x.EncryptionIvBase64,
                ContentChecksumSha256 = x.ContentChecksumSha256,
            })
            .ToListAsync(cancellationToken);

        foreach (var item in shared)
        {
            if (owned.Any(x => x.MediaAssetId == item.MediaAssetId)) continue;
            owned.Add(item);
        }

        return owned.OrderBy(x => x.Title).ToList();
    }

    public async Task<DesktopPlaybackPackageQri?> GetPlaybackPackageAsync(
        long userId,
        long mediaAssetId,
        string grantToken,
        string? deviceId = null,
        CancellationToken cancellationToken = default)
    {
        var media = await _dbContext.MediaAssets.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == mediaAssetId
                && x.IsEncrypted
                && x.EncryptionStatus == (int)EncryptedMediaStatus.Ready, cancellationToken);

        if (media is null || string.IsNullOrWhiteSpace(media.EncryptedFileUrl))
            return null;

        var isOwner = media.OwnerUserId == userId;
        OfflinePlaybackGrantQueryModel? grant = null;

        if (!isOwner)
        {
            if (string.IsNullOrWhiteSpace(grantToken))
                return null;

            var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(grantToken)));
            grant = await _dbContext.OfflinePlaybackGrants.AsNoTracking()
                .Where(x => x.TokenHash == hash && x.UserId == userId && x.RevokedAtUtc == null && !x.IsDelete)
                .OrderByDescending(x => x.ExpiresAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (grant is null || grant.ExpiresAtUtc <= DateTime.UtcNow)
                return null;

            // Grant was issued only after MaxDevices binder succeeded for this device.
            // Trust grant.DeviceId — do NOT re-deny via legacy BoundDeviceId (that column often
            // still points at device #1 after a 2nd binding was added).
            if (!string.IsNullOrWhiteSpace(grant.DeviceId))
            {
                if (string.IsNullOrWhiteSpace(deviceId)
                    || !string.Equals(grant.DeviceId, deviceId.Trim(), StringComparison.OrdinalIgnoreCase))
                    return null;
            }

            var enrollment = await _dbContext.Enrollments.AsNoTracking()
                .Join(
                    _dbContext.Students.AsNoTracking(),
                    e => e.StudentId,
                    s => s.StudentId,
                    (e, s) => new { e, s })
                .Where(x => x.s.UserId == userId
                    && x.e.CourseId == grant.CourseId
                    && x.e.IsActive)
                .Select(x => new { x.e.Id })
                .FirstOrDefaultAsync(cancellationToken);

            if (enrollment is null)
                return null;

            var mediaBelongsToCourse =
                await _dbContext.CourseLessons.AsNoTracking()
                    .AnyAsync(l => l.MediaAssetId == mediaAssetId
                                   && l.CourseSection != null
                                   && l.CourseSection.CourseId == grant.CourseId, cancellationToken)
                || await _dbContext.CourseCurriculumMaterials.AsNoTracking()
                    .AnyAsync(m => m.MediaAssetId == mediaAssetId
                                   && m.CourseId == grant.CourseId
                                   && !m.IsDelete, cancellationToken);

            if (!mediaBelongsToCourse)
                return null;
        }

        return new DesktopPlaybackPackageQri
        {
            MediaAssetId = media.Id,
            Title = media.Title ?? media.OriginalFileName,
            MimeType = media.MimeType,
            EncryptedFileUrl = media.EncryptedFileUrl!,
            EncryptionAlgorithm = media.EncryptionAlgorithm ?? "AES-256-CBC",
            IvBase64 = media.EncryptionIvBase64 ?? string.Empty,
            ContentChecksumSha256 = media.ContentChecksumSha256,
            GrantExpiresAtUtc = grant?.ExpiresAtUtc ?? DateTime.UtcNow.AddHours(OfflinePlaybackGrant.DefaultTtlHours),
            ContentKeyId = media.ContentKeyId ?? string.Empty,
        };
    }

    public async Task<DesktopLicenseValidationQri?> ValidateDesktopLicenseAsync(
        long userId,
        string licenseKey,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0 || string.IsNullOrWhiteSpace(licenseKey))
            return null;

        var normalized = licenseKey.Trim();
        var utcNow = DateTime.UtcNow;
        var row = await (
            from e in _dbContext.Enrollments.AsNoTracking()
            join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
            join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
            where s.UserId == userId
                  && e.DesktopLicenseKey == normalized
                  && (c.DeliveryMode == CourseDeliveryMode.DesktopLicense
                      || c.DeliveryMode == CourseDeliveryMode.SpotPlayerLicense)
            select new
            {
                e.Id,
                CourseId = c.CourseId,
                CourseTitle = c.Title,
                e.IsActive,
                e.IsDesktopLicenseActive,
                e.DesktopLicenseExpiresAtUtc,
            }).FirstOrDefaultAsync(cancellationToken);

        if (row is null)
            return null;

        if (!row.IsActive || !row.IsDesktopLicenseActive)
            return null;

        if (row.DesktopLicenseExpiresAtUtc.HasValue && row.DesktopLicenseExpiresAtUtc.Value <= utcNow)
            return null;

        return new DesktopLicenseValidationQri
        {
            EnrollmentId = row.Id,
            CourseId = row.CourseId,
            CourseTitle = row.CourseTitle ?? string.Empty,
            LicenseKey = normalized,
        };
    }

    public async Task<List<DesktopLicensedCourseQri>> ListDesktopLicensedCoursesAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            return [];

        var utcNow = DateTime.UtcNow;
        var rows = await (
            from e in _dbContext.Enrollments.AsNoTracking()
            join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
            join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
            join t in _dbContext.Teachers.AsNoTracking() on c.TeacherId equals t.Id into teacherJoin
            from t in teacherJoin.DefaultIfEmpty()
            join u in _dbContext.Users.AsNoTracking() on t.UserId equals u.Id into userJoin
            from u in userJoin.DefaultIfEmpty()
            where s.UserId == userId
                  && (c.DeliveryMode == CourseDeliveryMode.DesktopLicense
                      || c.DeliveryMode == CourseDeliveryMode.SpotPlayerLicense)
            orderby e.EnrollmentDateTime descending
            select new
            {
                CourseId = c.CourseId,
                CourseTitle = c.Title,
                e.DesktopLicenseKey,
                e.IsActive,
                e.IsDesktopLicenseActive,
                e.DesktopLicenseExpiresAtUtc,
                TeacherId = t != null ? t.Id : 0L,
                FirstName = u != null ? u.FirstName : null,
                LastName = u != null ? u.LastName : null,
            }).ToListAsync(cancellationToken);

        return rows.Select(row =>
        {
            var teacherName = $"{row.FirstName} {row.LastName}".Trim();
            // Discovery lists every active Desktop/SpotPlayer enrollment (even before key entry).
            // Unlocking a course still requires ValidateDesktopLicense on the client.
            _ = utcNow;
            return new DesktopLicensedCourseQri
            {
                CourseId = row.CourseId,
                CourseTitle = row.CourseTitle ?? string.Empty,
                DesktopLicenseKey = row.DesktopLicenseKey,
                IsActive = row.IsActive,
                TeacherId = row.TeacherId,
                TeacherName = string.IsNullOrWhiteSpace(teacherName) ? "مدرس" : teacherName,
            };
        }).ToList();
    }

    public async Task<DesktopCourseCurriculumQri?> GetDesktopCourseCurriculumAsync(
        long userId,
        long courseId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0 || courseId <= 0)
            return null;

        var enrolled = await IsUserEnrolledInCourseAsync(userId, courseId, cancellationToken);
        if (!enrolled)
            return null;

        var courseWithSections = await _dbContext.Courses.AsNoTracking()
            .Include(c => c.Sections)
            .ThenInclude(s => s.Lessons)
            .FirstOrDefaultAsync(
                c => c.CourseId == courseId
                     && (c.DeliveryMode == CourseDeliveryMode.DesktopLicense
                         || c.DeliveryMode == CourseDeliveryMode.SpotPlayerLicense),
                cancellationToken);
        if (courseWithSections is null)
            return null;

        var accessInfo = await GetEnrollmentContentAccessAsync(userId, courseId, cancellationToken);
        HashSet<long> allowedLessonIds = [];
        if (accessInfo.ContentAccessMode == DesktopContentAccessMode.Partial && accessInfo.EnrollmentId > 0)
            allowedLessonIds = await GetAllowedLessonIdsForEnrollmentAsync(accessInfo.EnrollmentId, cancellationToken);

        var materialRows = await (
            from m in _dbContext.CourseCurriculumMaterials.AsNoTracking()
            join a in _dbContext.MediaAssets.AsNoTracking() on m.MediaAssetId equals a.Id into assetJoin
            from a in assetJoin.DefaultIfEmpty()
            where m.CourseId == courseId && !m.IsDelete
            orderby m.SortOrder, m.Id
            select new
            {
                m.Id,
                m.CourseSectionId,
                m.CourseLessonId,
                Qri = new DesktopCourseCurriculumMaterialQri
                {
                    MaterialId = m.Id,
                    MediaAssetId = m.MediaAssetId,
                    DisplayName = m.DisplayName,
                    OriginalFileName = a != null ? a.OriginalFileName : null,
                    FileSizeBytes = a != null ? a.FileSizeBytes : null,
                    IsEncrypted = a != null && a.IsEncrypted,
                },
            }).ToListAsync(cancellationToken);

        var sections = (courseWithSections.Sections ?? [])
            .OrderBy(s => s.Id)
            .Select(s =>
            {
                var sectionMaterials = materialRows
                    .Where(m => m.CourseSectionId == s.Id && m.CourseLessonId == null)
                    .Select(m => m.Qri)
                    .ToList();

                var lessons = (s.Lessons ?? [])
                    .OrderBy(l => l.SortOrder)
                    .ThenBy(l => l.Id)
                    .Select(l =>
                    {
                        var lessonMaterials = materialRows
                            .Where(m => m.CourseLessonId == l.Id)
                            .Select(m => m.Qri)
                            .ToList();

                        return new DesktopCourseLessonQri
                        {
                            LessonId = l.Id,
                            Title = l.LessonTitle ?? string.Empty,
                            VideoTitle = l.VideoTitle,
                            DurationSeconds = l.DurationSeconds,
                            IsPublished = l.IsPublished,
                            MediaAssetId = l.MediaAssetId,
                            HasEncryptedVideo = l.MediaAssetId is > 0,
                            IsLocked = accessInfo.ContentAccessMode == DesktopContentAccessMode.Partial
                                && !allowedLessonIds.Contains(l.Id),
                            HasMaterials = lessonMaterials.Count > 0,
                            Materials = lessonMaterials,
                        };
                    })
                    .ToList();

                return new DesktopCourseSectionQri
                {
                    SectionId = s.Id,
                    Title = s.SessionName ?? string.Empty,
                    HasMaterials = sectionMaterials.Count > 0,
                    Materials = sectionMaterials,
                    Lessons = lessons,
                };
            })
            .ToList();

        return new DesktopCourseCurriculumQri
        {
            CourseId = courseId,
            CourseTitle = courseWithSections.Title ?? string.Empty,
            Sections = sections,
        };
    }

    public async Task<List<StudentDesktopLicenseQri>> ListStudentDesktopLicensesAsync(
        long targetUserId,
        long studentId,
        long? teacherIdFilter,
        CancellationToken cancellationToken = default)
    {
        if (targetUserId <= 0 && studentId <= 0)
            return [];

        var utcNow = DateTime.UtcNow;
        var q = from e in _dbContext.Enrollments.AsNoTracking()
                join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
                join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
                join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
                join t in _dbContext.Teachers.AsNoTracking() on c.TeacherId equals t.Id into teacherJoin
                from t in teacherJoin.DefaultIfEmpty()
                join tu in _dbContext.Users.AsNoTracking() on t.UserId equals tu.Id into teacherUserJoin
                from tu in teacherUserJoin.DefaultIfEmpty()
                where (c.DeliveryMode == CourseDeliveryMode.DesktopLicense
                      || c.DeliveryMode == CourseDeliveryMode.SpotPlayerLicense)
                      && !string.IsNullOrEmpty(e.DesktopLicenseKey)
                      && (targetUserId <= 0 || s.UserId == targetUserId)
                      && (studentId <= 0 || s.StudentId == studentId)
                select new
                {
                    e.Id,
                    UserId = u.Id,
                    s.StudentId,
                    StudentName = ((u.FirstName ?? string.Empty) + " " + (u.LastName ?? string.Empty)).Trim(),
                    CourseId = c.CourseId,
                    CourseTitle = c.Title,
                    TeacherId = (long?)t.Id,
                    TeacherName = tu != null
                        ? ((tu.FirstName ?? string.Empty) + " " + (tu.LastName ?? string.Empty)).Trim()
                        : null,
                    e.DesktopLicenseKey,
                    e.IsActive,
                    e.IsDesktopLicenseActive,
                    e.DesktopLicenseExpiresAtUtc,
                    e.DesktopLicenseMaxDevices,
                    e.DesktopLicenseAllowedOs,
                    e.DesktopContentAccessMode,
                    e.EnrollmentDateTime,
                };

        if (teacherIdFilter is > 0)
            q = q.Where(x => x.TeacherId == teacherIdFilter.Value);

        var rows = await q.OrderByDescending(x => x.EnrollmentDateTime).ToListAsync(cancellationToken);
        if (rows.Count == 0)
            return [];

        var enrollmentIds = rows.Select(x => x.Id).ToList();
        var lessonAccess = await _dbContext.DesktopLicenseLessonAccesses.AsNoTracking()
            .Where(x => !x.IsDelete && enrollmentIds.Contains(x.EnrollmentId))
            .GroupBy(x => x.EnrollmentId)
            .Select(g => new { EnrollmentId = g.Key, LessonIds = g.Select(x => x.LessonId).ToList() })
            .ToListAsync(cancellationToken);

        var deviceCounts = await _dbContext.DesktopLicenseDeviceBindings.AsNoTracking()
            .Where(x => !x.IsDelete && enrollmentIds.Contains(x.EnrollmentId) && x.RevokedAtUtc == null)
            .GroupBy(x => x.EnrollmentId)
            .Select(g => new { EnrollmentId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var lessonMap = lessonAccess.ToDictionary(x => x.EnrollmentId, x => x.LessonIds);
        var deviceMap = deviceCounts.ToDictionary(x => x.EnrollmentId, x => x.Count);

        return rows.Select(row =>
        {
            var isValid = row.IsActive
                && row.IsDesktopLicenseActive
                && !string.IsNullOrWhiteSpace(row.DesktopLicenseKey)
                && (!row.DesktopLicenseExpiresAtUtc.HasValue || row.DesktopLicenseExpiresAtUtc.Value > utcNow);
            return new StudentDesktopLicenseQri
            {
                EnrollmentId = row.Id,
                UserId = row.UserId,
                StudentId = row.StudentId,
                StudentName = string.IsNullOrWhiteSpace(row.StudentName) ? null : row.StudentName,
                CourseId = row.CourseId,
                CourseTitle = row.CourseTitle ?? string.Empty,
                TeacherId = row.TeacherId,
                TeacherName = row.TeacherName,
                DesktopLicenseKey = row.DesktopLicenseKey,
                IsEnrollmentActive = row.IsActive,
                IsDesktopLicenseActive = row.IsDesktopLicenseActive,
                DesktopLicenseExpiresAtUtc = row.DesktopLicenseExpiresAtUtc,
                IsCurrentlyValid = isValid,
                EnrollmentDateTime = row.EnrollmentDateTime.ToString("yyyy/MM/dd - HH:mm"),
                MaxDevices = row.DesktopLicenseMaxDevices,
                AllowedOs = (byte)row.DesktopLicenseAllowedOs,
                ContentAccessMode = (byte)row.DesktopContentAccessMode,
                AllowedLessonIds = lessonMap.TryGetValue(row.Id, out var ids) ? ids : [],
                ActiveDeviceCount = deviceMap.TryGetValue(row.Id, out var count) ? count : 0,
            };
        }).ToList();
    }

    public async Task<CourseDesktopWatermarkPolicyQri?> GetCourseWatermarkPolicyAsync(
        long courseId,
        CancellationToken cancellationToken = default)
    {
        if (courseId <= 0)
            return null;

        var row = await _dbContext.CourseDesktopWatermarkPolicies.AsNoTracking()
            .FirstOrDefaultAsync(x => !x.IsDelete && x.CourseId == courseId, cancellationToken);

        if (row is null)
        {
            return new CourseDesktopWatermarkPolicyQri
            {
                CourseId = courseId,
                PlatformLogoLocked = true,
            };
        }

        return MapWatermarkPolicy(row);
    }

    public async Task<List<CourseDesktopLicenseEnrollmentQri>> ListCourseDesktopLicensesAsync(
        long courseId,
        CancellationToken cancellationToken = default)
    {
        if (courseId <= 0)
            return [];

        var utcNow = DateTime.UtcNow;
        var rows = await (
            from e in _dbContext.Enrollments.AsNoTracking()
            join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
            join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
            where e.CourseId == courseId && !string.IsNullOrEmpty(e.DesktopLicenseKey)
            orderby e.EnrollmentDateTime descending
            select new
            {
                e.Id,
                e.StudentId,
                UserId = u.Id,
                StudentName = ((u.FirstName ?? string.Empty) + " " + (u.LastName ?? string.Empty)).Trim(),
                e.DesktopLicenseKey,
                e.IsActive,
                e.IsDesktopLicenseActive,
                e.DesktopLicenseExpiresAtUtc,
                e.DesktopLicenseMaxDevices,
                e.DesktopLicenseAllowedOs,
                e.DesktopContentAccessMode,
            }).ToListAsync(cancellationToken);

        if (rows.Count == 0)
            return [];

        var enrollmentIds = rows.Select(x => x.Id).ToList();
        var lessonAccess = await _dbContext.DesktopLicenseLessonAccesses.AsNoTracking()
            .Where(x => !x.IsDelete && enrollmentIds.Contains(x.EnrollmentId))
            .GroupBy(x => x.EnrollmentId)
            .Select(g => new { EnrollmentId = g.Key, LessonIds = g.Select(x => x.LessonId).ToList() })
            .ToListAsync(cancellationToken);

        var deviceCounts = await _dbContext.DesktopLicenseDeviceBindings.AsNoTracking()
            .Where(x => !x.IsDelete && enrollmentIds.Contains(x.EnrollmentId) && x.RevokedAtUtc == null)
            .GroupBy(x => x.EnrollmentId)
            .Select(g => new { EnrollmentId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var lessonMap = lessonAccess.ToDictionary(x => x.EnrollmentId, x => x.LessonIds);
        var deviceMap = deviceCounts.ToDictionary(x => x.EnrollmentId, x => x.Count);

        return rows.Select(row =>
        {
            var isValid = row.IsActive
                && row.IsDesktopLicenseActive
                && !string.IsNullOrWhiteSpace(row.DesktopLicenseKey)
                && (!row.DesktopLicenseExpiresAtUtc.HasValue || row.DesktopLicenseExpiresAtUtc.Value > utcNow);
            return new CourseDesktopLicenseEnrollmentQri
            {
                EnrollmentId = row.Id,
                StudentId = row.StudentId,
                UserId = row.UserId,
                StudentName = string.IsNullOrWhiteSpace(row.StudentName) ? null : row.StudentName,
                DesktopLicenseKey = row.DesktopLicenseKey,
                IsDesktopLicenseActive = row.IsDesktopLicenseActive,
                DesktopLicenseExpiresAtUtc = row.DesktopLicenseExpiresAtUtc,
                IsCurrentlyValid = isValid,
                MaxDevices = row.DesktopLicenseMaxDevices,
                AllowedOs = row.DesktopLicenseAllowedOs,
                ContentAccessMode = row.DesktopContentAccessMode,
                AllowedLessonIds = lessonMap.TryGetValue(row.Id, out var ids) ? ids.ToArray() : [],
                ActiveDeviceCount = deviceMap.TryGetValue(row.Id, out var count) ? count : 0,
            };
        }).ToList();
    }

    public async Task<List<DesktopLicenseDeviceBindingQri>> ListDesktopLicenseDevicesAsync(
        long enrollmentId,
        CancellationToken cancellationToken = default)
    {
        if (enrollmentId <= 0)
            return [];

        return await _dbContext.DesktopLicenseDeviceBindings.AsNoTracking()
            .Where(x => !x.IsDelete && x.EnrollmentId == enrollmentId)
            .OrderByDescending(x => x.ActivatedAtUtc)
            .Select(x => new DesktopLicenseDeviceBindingQri
            {
                Id = x.Id,
                EnrollmentId = x.EnrollmentId,
                DeviceId = x.DeviceId,
                OsFamily = x.OsFamily,
                MachineName = x.MachineName,
                ActivatedAtUtc = x.ActivatedAtUtc,
                RevokedAtUtc = x.RevokedAtUtc,
                RevokeReason = x.RevokeReason,
                IsActive = x.RevokedAtUtc == null,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CourseDesktopAnalyticsQri> GetCourseDesktopAnalyticsAsync(
        long courseId,
        CancellationToken cancellationToken = default)
    {
        if (courseId <= 0)
            return new CourseDesktopAnalyticsQri();

        var events = await _dbContext.DesktopPlaybackEvents.AsNoTracking()
            .Where(x => !x.IsDelete && x.CourseId == courseId)
            .ToListAsync(cancellationToken);

        var lessonTitles = await _dbContext.CourseLessons.AsNoTracking()
            .Include(l => l.CourseSection)
            .Where(l => l.CourseSection != null && l.CourseSection.CourseId == courseId)
            .Select(l => new { l.Id, Title = l.LessonTitle ?? string.Empty })
            .ToListAsync(cancellationToken);

        var titleMap = lessonTitles.ToDictionary(x => x.Id, x => x.Title);

        var lessonStats = events
            .GroupBy(x => x.LessonId)
            .Select(g => new CourseDesktopLessonAnalyticsQri
            {
                LessonId = g.Key,
                LessonTitle = titleMap.TryGetValue(g.Key, out var title) ? title : string.Empty,
                TotalWatchedSeconds = g.Sum(x => x.WatchedDeltaSeconds),
                UniqueViewerCount = g.Select(x => x.UserId).Distinct().Count(),
                EventCount = g.Count(),
            })
            .OrderByDescending(x => x.TotalWatchedSeconds)
            .ToList();

        var userIds = events.Select(x => x.UserId).Distinct().ToList();
        var users = await _dbContext.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                Name = ((u.FirstName ?? string.Empty) + " " + (u.LastName ?? string.Empty)).Trim(),
            })
            .ToListAsync(cancellationToken);
        var userMap = users.ToDictionary(x => x.Id, x => x.Name);

        var studentStats = events
            .GroupBy(x => x.UserId)
            .Select(g => new CourseDesktopStudentAnalyticsQri
            {
                UserId = g.Key,
                EnrollmentId = g.Select(x => x.EnrollmentId).FirstOrDefault(id => id.HasValue),
                StudentName = userMap.TryGetValue(g.Key, out var name) && !string.IsNullOrWhiteSpace(name) ? name : null,
                TotalWatchedSeconds = g.Sum(x => x.WatchedDeltaSeconds),
                LessonsTouched = g.Select(x => x.LessonId).Distinct().Count(),
                LastActivityUtc = g.Max(x => x.CreatedAtUtc),
            })
            .OrderByDescending(x => x.TotalWatchedSeconds)
            .ToList();

        return new CourseDesktopAnalyticsQri
        {
            CourseId = courseId,
            Lessons = lessonStats,
            Students = studentStats,
        };
    }

    public async Task<List<TeacherStudentSatisfactionItemQri>> ListTeacherStudentSatisfactionByCourseAsync(
        long courseId,
        CancellationToken cancellationToken = default)
    {
        if (courseId <= 0)
            return [];

        var rows = await (
            from r in _dbContext.TeacherStudentRatings.AsNoTracking()
            join u in _dbContext.Users.AsNoTracking() on r.StudentUserId equals u.Id
            where !r.IsDelete && r.CourseId == courseId
            orderby r.UpdatedAtUtc descending
            select new TeacherStudentSatisfactionItemQri
            {
                Id = r.Id,
                CourseId = r.CourseId,
                EnrollmentId = r.EnrollmentId,
                TeacherUserId = r.TeacherUserId,
                StudentUserId = r.StudentUserId,
                StudentName = ((u.FirstName ?? string.Empty) + " " + (u.LastName ?? string.Empty)).Trim(),
                Score = r.Score,
                Note = r.Note,
                UpdatedAtUtc = r.UpdatedAtUtc,
            }).ToListAsync(cancellationToken);

        foreach (var row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.StudentName))
                row.StudentName = null;
        }

        return rows;
    }

    public async Task<TeacherStudentSatisfactionItemQri?> GetTeacherStudentSatisfactionByEnrollmentAsync(
        long enrollmentId,
        CancellationToken cancellationToken = default)
    {
        if (enrollmentId <= 0)
            return null;

        return await (
            from r in _dbContext.TeacherStudentRatings.AsNoTracking()
            join u in _dbContext.Users.AsNoTracking() on r.StudentUserId equals u.Id
            where !r.IsDelete && r.EnrollmentId == enrollmentId
            orderby r.UpdatedAtUtc descending
            select new TeacherStudentSatisfactionItemQri
            {
                Id = r.Id,
                CourseId = r.CourseId,
                EnrollmentId = r.EnrollmentId,
                TeacherUserId = r.TeacherUserId,
                StudentUserId = r.StudentUserId,
                StudentName = ((u.FirstName ?? string.Empty) + " " + (u.LastName ?? string.Empty)).Trim(),
                Score = r.Score,
                Note = r.Note,
                UpdatedAtUtc = r.UpdatedAtUtc,
            }).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<DesktopWatermarkForPlaybackQri?> GetDesktopWatermarkForPlaybackAsync(
        long userId,
        long courseId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0 || courseId <= 0)
            return null;

        var enrolled = await IsUserEnrolledInCourseAsync(userId, courseId, cancellationToken);
        if (!enrolled)
            return null;

        var policy = await GetCourseWatermarkPolicyAsync(courseId, cancellationToken);
        if (policy is null)
            return null;

        var user = await _dbContext.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return null;

        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        return new DesktopWatermarkForPlaybackQri
        {
            CourseId = courseId,
            Policy = new DesktopWatermarkPolicyForPlaybackQri
            {
                TextTemplate = policy.TextTemplate,
                FontSize = policy.FontSize,
                FontColor = policy.FontColor,
                Opacity = policy.Opacity,
                Position = policy.Position,
                RotationDeg = policy.RotationDeg,
                Movement = policy.Movement,
                PaddingPx = policy.PaddingPx,
                PlatformLogoLocked = true,
            },
            Student = new DesktopWatermarkStudentFieldsQri
            {
                FullName = string.IsNullOrWhiteSpace(fullName) ? null : fullName,
                Email = string.IsNullOrWhiteSpace(user.Email) ? null : user.Email,
                Phone = string.IsNullOrWhiteSpace(user.PhoneNumber) ? null : user.PhoneNumber,
            },
        };
    }

    public async Task<HashSet<long>> GetAllowedLessonIdsForEnrollmentAsync(
        long enrollmentId,
        CancellationToken cancellationToken = default)
    {
        if (enrollmentId <= 0)
            return [];

        var ids = await _dbContext.DesktopLicenseLessonAccesses.AsNoTracking()
            .Where(x => !x.IsDelete && x.EnrollmentId == enrollmentId)
            .Select(x => x.LessonId)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }

    public async Task<(DesktopContentAccessMode ContentAccessMode, long EnrollmentId)> GetEnrollmentContentAccessAsync(
        long userId,
        long courseId,
        CancellationToken cancellationToken = default)
    {
        var row = await (
            from e in _dbContext.Enrollments.AsNoTracking()
            join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
            where s.UserId == userId && e.CourseId == courseId && e.IsActive
            select new { e.Id, e.DesktopContentAccessMode })
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
            return (DesktopContentAccessMode.Full, 0);

        return (row.DesktopContentAccessMode, row.Id);
    }

    private static CourseDesktopWatermarkPolicyQri MapWatermarkPolicy(CourseDesktopWatermarkPolicyQueryModel row) =>
        new()
        {
            CourseId = row.CourseId,
            TextTemplate = row.TextTemplate,
            FontSize = row.FontSize,
            FontColor = row.FontColor,
            Opacity = row.Opacity,
            Position = row.Position,
            RotationDeg = row.RotationDeg,
            Movement = row.Movement,
            PaddingPx = row.PaddingPx,
            PlatformLogoLocked = true,
            UpdatedAtUtc = row.UpdatedAtUtc,
        };
}
