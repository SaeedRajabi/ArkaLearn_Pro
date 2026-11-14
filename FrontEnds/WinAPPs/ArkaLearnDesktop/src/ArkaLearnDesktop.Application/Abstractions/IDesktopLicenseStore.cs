namespace ArkaLearnDesktop.Application.Abstractions;

public sealed record UnlockedCourseLicense(
    long CourseId,
    long EnrollmentId,
    string LicenseKey,
    string CourseTitle,
    long TeacherId,
    string TeacherName);

public interface IDesktopLicenseStore
{
    Task<IReadOnlyList<UnlockedCourseLicense>> GetUnlockedCoursesAsync(CancellationToken cancellationToken = default);
    Task SaveUnlockedCourseAsync(UnlockedCourseLicense course, CancellationToken cancellationToken = default);
    Task RemoveUnlockedCourseAsync(long courseId, CancellationToken cancellationToken = default);
    Task ClearAllUnlockedAsync(CancellationToken cancellationToken = default);

    /// <summary>Legacy single-key helpers (used during migration).</summary>
    Task<string?> GetSavedLicenseKeyAsync(CancellationToken cancellationToken = default);
    Task SaveLicenseKeyAsync(string licenseKey, CancellationToken cancellationToken = default);
    Task ClearLicenseKeyAsync(CancellationToken cancellationToken = default);
}
