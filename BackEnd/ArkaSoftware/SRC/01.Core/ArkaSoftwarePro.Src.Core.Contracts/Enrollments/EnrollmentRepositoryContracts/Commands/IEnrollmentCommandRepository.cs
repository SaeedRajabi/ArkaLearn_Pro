using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;

public interface IEnrollmentCommandRepository:ICommandRepository<Enrollment , long>
{
    Task<List<Enrollment>> GetByStudentAndTeacherAsync(long studentId, long teacherId);

    Task<Enrollment?> GetByIdForEditAsync(long enrollmentId, CancellationToken cancellationToken = default);

    Task<Enrollment?> GetByStudentAndCourseAsync(long studentId, long courseId, CancellationToken cancellationToken = default);

    Task<Enrollment?> GetByUserIdAndCourseAsync(long userId, long courseId, CancellationToken cancellationToken = default);

    Task<Enrollment?> GetByUserIdAndDesktopLicenseKeyAsync(long userId, string licenseKey, CancellationToken cancellationToken = default);

    /// <summary>
    /// Assigns desktop license keys to active enrollments on DesktopLicense courses that still lack a key
    /// (e.g. student enrolled before the course switched to desktop delivery).
    /// </summary>
    Task<int> EnsureDesktopLicensesForUserAsync(long userId, CancellationToken cancellationToken = default);

    Task<Installment?> GetInstallmentByIdAsync(long installmentId, CancellationToken cancellationToken = default);

    Task<List<Installment>> GetDueCourseInstallmentRemindersAsync(DateTime utcNow, CancellationToken cancellationToken = default);

    Task<List<Enrollment>> GetInstallmentEnrollmentsForAdminAsync(CancellationToken cancellationToken = default);
}