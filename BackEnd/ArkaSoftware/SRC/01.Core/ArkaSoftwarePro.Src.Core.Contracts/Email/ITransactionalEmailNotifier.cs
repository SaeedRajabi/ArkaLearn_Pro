namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public interface ITransactionalEmailNotifier
{
    Task SendWelcomeAsync(string toEmail, string recipientName, bool isTeacher, CancellationToken cancellationToken = default);

    Task SendCourseEnrollmentInvoiceAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string invoiceNumber,
        string amountLabel,
        string? paymentReference,
        CancellationToken cancellationToken = default);

    Task SendCourseOnlineAccessAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string accessLink,
        CancellationToken cancellationToken = default);

    Task SendCourseEnrollmentLicenseAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string teacherName,
        string licenseKey,
        string desktopDownloadUrl,
        string accessLink,
        CancellationToken cancellationToken = default);

    Task SendTeacherCoursePurchaseAsync(
        string toEmail,
        string recipientName,
        string studentName,
        string courseTitle,
        string earningsLink,
        CancellationToken cancellationToken = default);

    Task SendTeacherDesktopLicenseRequestAsync(
        string toEmail,
        string recipientName,
        string studentName,
        string courseTitle,
        string studentsLink,
        CancellationToken cancellationToken = default);

    Task SendStudentDesktopLicenseIssuedAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string teacherName,
        string licenseKey,
        string accessLabel,
        string durationLabel,
        string desktopDownloadUrl,
        string accessLink,
        CancellationToken cancellationToken = default);

    Task SendCourseInstallmentDueAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        int installmentNumber,
        int daysRemaining,
        string amountLabel,
        string paymentLink,
        CancellationToken cancellationToken = default);

    Task SendEducationPlanAssignedAsync(
        string toEmail,
        string recipientName,
        string planTitle,
        string teacherName,
        string totalHoursLabel,
        string totalCostLabel,
        string paymentTypeLabel,
        string installmentsHtml,
        string plansLink,
        CancellationToken cancellationToken = default);

    Task SendEducationPlanInstallmentDueStudentAsync(
        string toEmail,
        string recipientName,
        string planTitle,
        int installmentNumber,
        int offsetDays,
        string amountLabel,
        string dueDateLabel,
        string paymentLink,
        CancellationToken cancellationToken = default);

    Task SendEducationPlanInstallmentDueTeacherAsync(
        string toEmail,
        string recipientName,
        string studentName,
        string planTitle,
        int installmentNumber,
        int offsetDays,
        string amountLabel,
        string dueDateLabel,
        CancellationToken cancellationToken = default);

    Task SendSeminarRegistrationAsync(
        string toEmail,
        string recipientName,
        string seminarTitle,
        string amountLabel,
        string? paymentReference,
        CancellationToken cancellationToken = default);

    Task SendSeminarOnlineAccessAsync(
        string toEmail,
        string recipientName,
        string seminarTitle,
        string roomLink,
        string roomUserName,
        string roomPassword,
        CancellationToken cancellationToken = default);

    Task SendTeacherAdPlanAsync(
        string toEmail,
        string recipientName,
        string planName,
        string amountLabel,
        string expiryDate,
        CancellationToken cancellationToken = default);

    Task SendTeacherAutoBumpAsync(
        string toEmail,
        string recipientName,
        string packageName,
        string amountLabel,
        string bumpCount,
        CancellationToken cancellationToken = default);

    Task SendStudentSupportPlanAsync(
        string toEmail,
        string recipientName,
        string planName,
        string amountLabel,
        string expiryDate,
        CancellationToken cancellationToken = default);

    Task SendPasswordResetAsync(
        string toEmail,
        string recipientName,
        string resetLink,
        int expiryMinutes,
        CancellationToken cancellationToken = default);

    Task SendTeacherSharedFileDownloadedAsync(
        string toEmail,
        string recipientName,
        string studentFullName,
        string fileTitle,
        CancellationToken cancellationToken = default);

    Task SendExamAssignedAsync(
        string toEmail,
        string recipientName,
        string professorName,
        string examTitle,
        string examDescription,
        string levelLabel,
        string durationLabel,
        string deadlineLabel,
        string examsLink,
        CancellationToken cancellationToken = default);

    Task SendExamSubmittedToTeacherAsync(
        string toEmail,
        string recipientName,
        string studentName,
        string examTitle,
        string durationLabel,
        string questionCountLabel,
        string gradingLink,
        CancellationToken cancellationToken = default);
}
