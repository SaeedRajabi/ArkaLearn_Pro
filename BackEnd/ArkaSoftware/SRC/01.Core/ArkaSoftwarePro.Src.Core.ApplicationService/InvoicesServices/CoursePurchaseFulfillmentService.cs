using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices;

/// <summary>
/// ثبت‌نام پس از پرداخت: DB به‌صورت ترتیبی (امن برای EF)، ایمیل‌ها موازی.
/// لایسنس دسکتاپ برای دوره‌های غیرقسطی صادر نمی‌شود — دانشجو باید درخواست بدهد و استاد تأیید کند.
/// </summary>
public sealed class CoursePurchaseFulfillmentService(
    IEnrollmentCommandRepository enrollmentCommandRepository,
    ICourseCommandRepository courseCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    ITransactionalEmailNotifier transactionalEmailNotifier,
    CourseEnrollmentNotifier enrollmentNotifier,
    ITeacherQueryRepository teacherQueryRepository,
    IUserQueryRepository userQueryRepository,
    IConfiguration configuration,
    ILogger<CoursePurchaseFulfillmentService> logger)
{
    public async Task FulfillOrderItemsAsync(
        long studentId,
        IEnumerable<(long CourseId, string CourseTitle)> items,
        string? invoiceNumber,
        decimal invoiceTotalAmount,
        string? studentEmail,
        string studentName,
        CancellationToken cancellationToken = default)
    {
        var emailJobs = new List<Func<Task>>();
        var amountLabel = invoiceTotalAmount <= 0 ? "رایگان" : $"{invoiceTotalAmount:N0} تومان";

        foreach (var item in items)
        {
            var result = await FulfillSingleCourseAsync(
                studentId,
                item.CourseId,
                item.CourseTitle,
                invoiceNumber,
                studentName,
                cancellationToken);

            if (result is null)
                continue;

            if (string.IsNullOrWhiteSpace(studentEmail))
                continue;

            var email = studentEmail;
            var title = string.IsNullOrWhiteSpace(item.CourseTitle) ? result.Value.CourseTitle : item.CourseTitle;
            var teacherName = result.Value.TeacherName;
            var accessLink = result.Value.CourseSlugOrId;
            var downloadUrl = ResolveDesktopDownloadUrl();

            emailJobs.Add(() => transactionalEmailNotifier.SendCourseEnrollmentInvoiceAsync(
                email, studentName, title, invoiceNumber ?? "—", amountLabel, invoiceNumber, cancellationToken));

            if (!string.IsNullOrWhiteSpace(result.Value.LicenseKey))
            {
                var licenseKey = result.Value.LicenseKey!;
                emailJobs.Add(() => transactionalEmailNotifier.SendCourseEnrollmentLicenseAsync(
                    email, studentName, title, teacherName, licenseKey, downloadUrl, accessLink, cancellationToken));
            }
            else if (!result.Value.IsDesktopCourse)
            {
                emailJobs.Add(() => transactionalEmailNotifier.SendCourseOnlineAccessAsync(
                    email, studentName, title, accessLink, cancellationToken));
            }
        }

        if (emailJobs.Count > 0)
            await Task.WhenAll(emailJobs.Select(SafeEmail));
    }

    private async Task<(string? LicenseKey, string TeacherName, string CourseTitle, string CourseSlugOrId, bool IsDesktopCourse)?> FulfillSingleCourseAsync(
        long studentId,
        long courseId,
        string courseTitle,
        string? invoiceNumber,
        string studentName,
        CancellationToken cancellationToken)
    {
        var existing = await enrollmentCommandRepository.GetByStudentAndCourseAsync(studentId, courseId, cancellationToken);
        if (existing is not null)
        {
            logger.LogInformation(
                "Enrollment already exists for student {StudentId} course {CourseId}; skipping insert.",
                studentId, courseId);
            return null;
        }

        var course = await courseCommandRepository.GetCourseForEditAsync(courseId);
        var enrollment = new Enrollment(studentId, courseId, isActive: true);
        var now = DateTime.UtcNow;
        var isDesktop = course != null && CourseDeliveryModeParser.UsesArkaDesktopLicense(course.DeliveryMode);
        var isInstallment = course?.PaymentType == CoursePaymentType.Installment
            && course.InstallmentPlans.Count >= CourseInstallmentPlan.MinInstallmentCount;

        // لایسنس فقط برای اقساط (DRM تدریجی) خودکار است؛ بقیه دوره‌های دسکتاپ با درخواست دانشجو صادر می‌شوند.
        string? licenseKey = null;
        DateTime? expiresAt = now.AddYears(1);

        if (isInstallment)
        {
            licenseKey = DesktopLicenseGenerator.Generate();
            var plans = course!.InstallmentPlans.OrderBy(x => x.InstallmentNumber).ToList();
            foreach (var plan in plans)
            {
                var due = plan.InstallmentNumber == 1 ? now : (plan.DueDateUtc ?? now);
                var paid = plan.InstallmentNumber == 1;
                enrollment.AddInstallment(
                    plan.InstallmentNumber,
                    due,
                    plan.AmountToman,
                    paid,
                    paid ? now : null,
                    paid ? invoiceNumber : null);
            }

            expiresAt = enrollment.GetNextUnpaidDueDate() ?? now.AddYears(1);
            enrollment.AssignDesktopLicense(licenseKey, expiresAt);
        }

        await enrollmentCommandRepository.InsertAsync(enrollment);
        await enrollmentCommandRepository.CommitAsync();

        if (isInstallment && course != null)
        {
            var orderedLessonIds = course.CourseSessions
                .OrderBy(s => s.Id)
                .SelectMany(s => s.CourseLessons.OrderBy(l => l.SortOrder).Select(l => l.Id))
                .Where(id => id > 0)
                .ToList();

            var unlockedLessons = CourseInstallmentUnlockCalculator.GetUnlockedLessonIds(
                orderedLessonIds,
                paidInstallmentCount: 1,
                totalInstallments: course.InstallmentPlans.Count);

            var isPartial = unlockedLessons.Count > 0 && unlockedLessons.Count < orderedLessonIds.Count;
            enrollment.ConfigureDesktopContentAccess(
                isPartial ? DesktopContentAccessMode.Partial : DesktopContentAccessMode.Full);

            await drmRepository.ReplaceLessonAccessAsync(
                enrollment.Id,
                isPartial ? unlockedLessons : Array.Empty<long>(),
                cancellationToken);
            await enrollmentCommandRepository.CommitAsync();
            await drmRepository.CommitAsync();
        }

        var teacherName = await ResolveTeacherNameAsync(course, cancellationToken);
        var resolvedTitle = course?.Title?.Value ?? courseTitle;
        var accessPath = $"/courses/{courseId}";

        try
        {
            if (course != null)
                await enrollmentNotifier.NotifyStudentEnrolledAsync(course, enrollment, studentName);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to notify staff about enrollment for course {CourseId}", courseId);
        }

        return (licenseKey ?? enrollment.DesktopLicenseKey, teacherName, resolvedTitle, accessPath, isDesktop);
    }

    private async Task<string> ResolveTeacherNameAsync(Course? course, CancellationToken cancellationToken)
    {
        if (course?.TeacherId is not > 0)
            return "استاد";

        try
        {
            var teacherUserId = await teacherQueryRepository.GetUserIdByTeacherIdAsync(course.TeacherId.Value);
            if (teacherUserId is not > 0)
                return "استاد";

            var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = teacherUserId.Value });
            var name = user?.FullName?.Trim();
            if (!string.IsNullOrWhiteSpace(name))
                return name!;
            if (!string.IsNullOrWhiteSpace(user?.UserName))
                return user!.UserName!;
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Could not resolve teacher name for course {CourseId}", course.Id);
        }

        return "استاد";
    }

    private string ResolveDesktopDownloadUrl()
    {
        var configured = configuration["DesktopApp:DownloadPageUrl"]
            ?? configuration["PaymentGateway:ClientBaseUrl"];
        var baseUrl = (configured ?? "https://arkasoftware.ir").Trim().TrimEnd('/');
        return $"{baseUrl}/account/desktop-app";
    }

    private static async Task SafeEmail(Func<Task> send)
    {
        try { await send(); }
        catch { /* do not fail purchase on email errors */ }
    }
}
