using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Local;

/// <summary>DPAPI-protected storage for unlocked course licenses on this device.</summary>
public sealed class ProtectedLicenseStore : IDesktopLicenseStore
{
    private static readonly string LicensePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ArkaLearnDesktop",
        "license.bin");

    public async Task ClearAllUnlockedAsync(CancellationToken cancellationToken = default)
    {
        if (File.Exists(LicensePath))
            File.Delete(LicensePath);
        await Task.CompletedTask;
    }

    public Task ClearLicenseKeyAsync(CancellationToken cancellationToken = default) =>
        ClearAllUnlockedAsync(cancellationToken);

    public async Task<IReadOnlyList<UnlockedCourseLicense>> GetUnlockedCoursesAsync(
        CancellationToken cancellationToken = default)
    {
        var file = await ReadFileAsync(cancellationToken);
        if (file?.Courses is { Count: > 0 })
            return file.Courses
                .Where(c => c.CourseId > 0 && !string.IsNullOrWhiteSpace(c.LicenseKey))
                .Select(c => new UnlockedCourseLicense(
                    c.CourseId,
                    c.EnrollmentId,
                    c.LicenseKey!.Trim(),
                    c.CourseTitle ?? string.Empty,
                    c.TeacherId,
                    c.TeacherName ?? "مدرس"))
                .ToList();

        // Migrate legacy single-key file.
        if (!string.IsNullOrWhiteSpace(file?.LicenseKey))
        {
            return
            [
                new UnlockedCourseLicense(
                    0,
                    0,
                    file.LicenseKey.Trim(),
                    string.Empty,
                    0,
                    "مدرس")
            ];
        }

        return [];
    }

    public async Task<string?> GetSavedLicenseKeyAsync(CancellationToken cancellationToken = default)
    {
        var courses = await GetUnlockedCoursesAsync(cancellationToken);
        return courses.FirstOrDefault()?.LicenseKey;
    }

    public async Task RemoveUnlockedCourseAsync(long courseId, CancellationToken cancellationToken = default)
    {
        var file = await ReadFileAsync(cancellationToken) ?? new LicenseFile();
        file.Courses ??= [];
        file.Courses.RemoveAll(c => c.CourseId == courseId);
        file.LicenseKey = file.Courses.FirstOrDefault()?.LicenseKey;
        await WriteFileAsync(file, cancellationToken);
    }

    public async Task SaveLicenseKeyAsync(string licenseKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(licenseKey))
        {
            await ClearAllUnlockedAsync(cancellationToken);
            return;
        }

        var file = await ReadFileAsync(cancellationToken) ?? new LicenseFile();
        file.LicenseKey = licenseKey.Trim();
        file.SavedAtUtc = DateTime.UtcNow;
        file.Courses ??= [];
        await WriteFileAsync(file, cancellationToken);
    }

    public async Task SaveUnlockedCourseAsync(UnlockedCourseLicense course, CancellationToken cancellationToken = default)
    {
        if (course.CourseId <= 0 || string.IsNullOrWhiteSpace(course.LicenseKey))
            return;

        var file = await ReadFileAsync(cancellationToken) ?? new LicenseFile();
        file.Courses ??= [];
        file.Courses.RemoveAll(c => c.CourseId == course.CourseId);
        file.Courses.Add(new CourseRow
        {
            CourseId = course.CourseId,
            EnrollmentId = course.EnrollmentId,
            LicenseKey = course.LicenseKey.Trim(),
            CourseTitle = course.CourseTitle,
            TeacherId = course.TeacherId,
            TeacherName = course.TeacherName,
        });
        file.LicenseKey = course.LicenseKey.Trim();
        file.SavedAtUtc = DateTime.UtcNow;
        await WriteFileAsync(file, cancellationToken);
    }

    private static async Task<LicenseFile?> ReadFileAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(LicensePath))
            return null;

        try
        {
            var protectedBytes = await File.ReadAllBytesAsync(LicensePath, cancellationToken);
            var json = Encoding.UTF8.GetString(ProtectedData.Unprotect(protectedBytes, null, DataProtectionScope.CurrentUser));
            return JsonSerializer.Deserialize<LicenseFile>(json);
        }
        catch
        {
            return null;
        }
    }

    private static async Task WriteFileAsync(LicenseFile file, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(LicensePath)!);
        var json = JsonSerializer.Serialize(file);
        var protectedBytes = ProtectedData.Protect(Encoding.UTF8.GetBytes(json), null, DataProtectionScope.CurrentUser);
        await File.WriteAllBytesAsync(LicensePath, protectedBytes, cancellationToken);
    }

    private sealed class LicenseFile
    {
        public string? LicenseKey { get; set; }
        public DateTime SavedAtUtc { get; set; }
        public List<CourseRow>? Courses { get; set; }
    }

    private sealed class CourseRow
    {
        public long CourseId { get; set; }
        public long EnrollmentId { get; set; }
        public string? LicenseKey { get; set; }
        public string? CourseTitle { get; set; }
        public long TeacherId { get; set; }
        public string? TeacherName { get; set; }
    }
}
