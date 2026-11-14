using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Services;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class EnrollmentCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<Enrollment, ArkaSoftwareCommandDbContext>(dbContext), IEnrollmentCommandRepository
{
    public async Task<List<Enrollment>> GetByStudentAndTeacherAsync(long studentId, long teacherId)
    {
        return await (
            from e in _dbContext.Set<Enrollment>()
            join c in _dbContext.Courses on e.CourseId equals c.Id
            where e.StudentId == studentId && c.TeacherId == teacherId
            select e).ToListAsync();
    }

    public async Task<int> EnsureDesktopLicensesForUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            return 0;

        var studentId = await _dbContext.Students
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .Select(s => (long?)s.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!studentId.HasValue || studentId.Value <= 0)
            return 0;

        var enrollments = await (
            from e in _dbContext.Set<Enrollment>()
            join c in _dbContext.Courses on e.CourseId equals c.Id
            where e.StudentId == studentId.Value
                  && c.DeliveryMode == CourseDeliveryMode.DesktopLicense
                  && (e.DesktopLicenseKey == null || e.DesktopLicenseKey == string.Empty)
            select e).ToListAsync(cancellationToken);

        if (enrollments.Count == 0)
            return 0;

        foreach (var enrollment in enrollments)
            enrollment.AssignDesktopLicense(DesktopLicenseGenerator.Generate(), expiresAtUtc: null);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return enrollments.Count;
    }

    public Task<Enrollment?> GetByIdForEditAsync(long enrollmentId, CancellationToken cancellationToken = default)
        => _dbContext.Set<Enrollment>()
            .FirstOrDefaultAsync(e => e.Id == enrollmentId, cancellationToken);

    public Task<Enrollment?> GetByStudentAndCourseAsync(long studentId, long courseId, CancellationToken cancellationToken = default)
        => _dbContext.Set<Enrollment>()
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId, cancellationToken);

    public async Task<Enrollment?> GetByUserIdAndCourseAsync(long userId, long courseId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0 || courseId <= 0)
            return null;

        return await (
            from e in _dbContext.Set<Enrollment>()
            join s in _dbContext.Students on e.StudentId equals s.Id
            where s.UserId == userId && e.CourseId == courseId
            select e).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Enrollment?> GetByUserIdAndDesktopLicenseKeyAsync(
        long userId,
        string licenseKey,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0 || string.IsNullOrWhiteSpace(licenseKey))
            return null;

        var normalized = licenseKey.Trim();
        return await (
            from e in _dbContext.Set<Enrollment>()
            join s in _dbContext.Students on e.StudentId equals s.Id
            where s.UserId == userId && e.DesktopLicenseKey == normalized
            select e).FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Installment?> GetInstallmentByIdAsync(long installmentId, CancellationToken cancellationToken = default)
        => _dbContext.Set<Installment>()
            .Include(i => i.Enrollment)!
                .ThenInclude(e => e!.Installments)
            .Include(i => i.Enrollment)!
                .ThenInclude(e => e!.Course)
            .Include(i => i.Enrollment)!
                .ThenInclude(e => e!.Student)!
                    .ThenInclude(s => s!.User)
            .FirstOrDefaultAsync(i => i.Id == installmentId, cancellationToken);

    public async Task<List<Installment>> GetDueCourseInstallmentRemindersAsync(
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        var today = utcNow.Date;
        var inTwoDays = today.AddDays(2);
        var inOneDay = today.AddDays(1);

        return await _dbContext.Set<Installment>()
            .Include(i => i.Enrollment)!
                .ThenInclude(e => e!.Student)!
                    .ThenInclude(s => s!.User)
            .Include(i => i.Enrollment)!
                .ThenInclude(e => e!.Course)
            .Where(i => !i.IsPaid && i.InstallmentNumber > 1)
            .Where(i =>
                (i.DueDate.Date == inTwoDays && i.ReminderTwoDaysSentAtUtc == null)
                || (i.DueDate.Date == inOneDay && i.ReminderOneDaySentAtUtc == null)
                || (i.DueDate.Date == today && i.ReminderDueDaySentAtUtc == null))
            .ToListAsync(cancellationToken);
    }

    public Task<List<Enrollment>> GetInstallmentEnrollmentsForAdminAsync(CancellationToken cancellationToken = default)
        => _dbContext.Set<Enrollment>()
            .Include(e => e.Installments)
            .Include(e => e.Course)
            .Include(e => e.Student)!
                .ThenInclude(s => s!.User)
            .Where(e => e.Installments.Any())
            .OrderByDescending(e => e.EnrollmentDateTime)
            .Take(500)
            .ToListAsync(cancellationToken);
}

