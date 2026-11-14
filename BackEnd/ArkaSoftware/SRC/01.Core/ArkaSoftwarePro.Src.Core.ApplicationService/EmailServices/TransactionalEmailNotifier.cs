using ArkaSoftwarePro.Src.Core.Contracts.Email;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public sealed class TransactionalEmailNotifier(
    TransactionalEmailSender sender,
    IConfiguration configuration) : ITransactionalEmailNotifier
{
    private string ClientBaseUrl =>
        configuration["PaymentGateway:ClientBaseUrl"]?.Trim().TrimEnd('/')
        ?? "https://arkasoftware.ir";

    public Task SendWelcomeAsync(string toEmail, string recipientName, bool isTeacher, CancellationToken cancellationToken = default)
    {
        var key = isTeacher ? EmailTemplateKeys.WelcomeTeacher : EmailTemplateKeys.WelcomeStudent;
        return sender.SendAsync(key, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["dashboardLink"] = ClientBaseUrl
        }, cancellationToken);
    }

    public Task SendCourseEnrollmentInvoiceAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string invoiceNumber,
        string amountLabel,
        string? paymentReference,
        CancellationToken cancellationToken = default)
        => sender.SendAsync(EmailTemplateKeys.CoursePurchaseInvoice, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["courseTitle"] = courseTitle,
            ["invoiceNumber"] = invoiceNumber,
            ["amountLabel"] = amountLabel,
            ["paymentReference"] = paymentReference ?? "—"
        }, cancellationToken);

    public Task SendCourseOnlineAccessAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string accessLink,
        CancellationToken cancellationToken = default)
    {
        var link = accessLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? accessLink
            : $"{ClientBaseUrl}{(accessLink.StartsWith('/') ? accessLink : $"/{accessLink}")}";

        return sender.SendAsync(EmailTemplateKeys.CourseOnlineAccess, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["courseTitle"] = courseTitle,
            ["accessLink"] = link
        }, cancellationToken);
    }

    public Task SendCourseEnrollmentLicenseAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string teacherName,
        string licenseKey,
        string desktopDownloadUrl,
        string accessLink,
        CancellationToken cancellationToken = default)
    {
        var access = accessLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? accessLink
            : $"{ClientBaseUrl}{(accessLink.StartsWith('/') ? accessLink : $"/{accessLink}")}";
        var download = desktopDownloadUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? desktopDownloadUrl
            : $"{ClientBaseUrl}{(desktopDownloadUrl.StartsWith('/') ? desktopDownloadUrl : $"/{desktopDownloadUrl}")}";

        return sender.SendAsync(EmailTemplateKeys.CourseEnrollmentLicense, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["courseTitle"] = courseTitle,
            ["teacherName"] = teacherName,
            ["licenseKey"] = licenseKey,
            ["desktopDownloadUrl"] = download,
            ["accessLink"] = access
        }, cancellationToken);
    }

    public Task SendCourseInstallmentDueAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        int installmentNumber,
        int daysRemaining,
        string amountLabel,
        string paymentLink,
        CancellationToken cancellationToken = default)
    {
        var link = paymentLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? paymentLink
            : $"{ClientBaseUrl}{(paymentLink.StartsWith('/') ? paymentLink : $"/{paymentLink}")}";

        var dueMessage = daysRemaining switch
        {
            2 => $"تا پرداخت قسط {installmentNumber} دوره <strong>{courseTitle}</strong> دو روز مهلت دارید.",
            1 => $"تا پرداخت قسط {installmentNumber} دوره <strong>{courseTitle}</strong> یک روز مهلت دارید.",
            _ => $"پرداخت قسط {installmentNumber} دوره <strong>{courseTitle}</strong> باید امروز انجام شود. لطفاً از لینک زیر اقدام کنید.",
        };

        return sender.SendAsync(EmailTemplateKeys.CourseInstallmentDue, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["courseTitle"] = courseTitle,
            ["installmentNumber"] = installmentNumber.ToString(),
            ["daysRemaining"] = daysRemaining.ToString(),
            ["dueMessage"] = dueMessage,
            ["amountLabel"] = amountLabel,
            ["paymentLink"] = link
        }, cancellationToken);
    }

    public Task SendEducationPlanAssignedAsync(
        string toEmail,
        string recipientName,
        string planTitle,
        string teacherName,
        string totalHoursLabel,
        string totalCostLabel,
        string paymentTypeLabel,
        string installmentsHtml,
        string plansLink,
        CancellationToken cancellationToken = default)
    {
        var link = plansLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? plansLink
            : $"{ClientBaseUrl}{(plansLink.StartsWith('/') ? plansLink : $"/{plansLink}")}";

        return sender.SendAsync(EmailTemplateKeys.EducationPlanAssigned, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["planTitle"] = planTitle,
            ["teacherName"] = teacherName,
            ["totalHours"] = totalHoursLabel,
            ["totalCostLabel"] = totalCostLabel,
            ["paymentTypeLabel"] = paymentTypeLabel,
            ["installmentsHtml"] = string.IsNullOrWhiteSpace(installmentsHtml)
                ? "پرداخت این پلن به‌صورت نقدی است."
                : installmentsHtml,
            ["plansLink"] = link,
        }, cancellationToken);
    }

    public Task SendExamAssignedAsync(
        string toEmail,
        string recipientName,
        string professorName,
        string examTitle,
        string examDescription,
        string levelLabel,
        string durationLabel,
        string deadlineLabel,
        string examsLink,
        CancellationToken cancellationToken = default)
    {
        var link = examsLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? examsLink
            : $"{ClientBaseUrl}{(examsLink.StartsWith('/') ? examsLink : $"/{examsLink}")}";

        return sender.SendAsync(EmailTemplateKeys.ExamAssigned, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["professorName"] = professorName,
            ["examTitle"] = examTitle,
            ["examDescription"] = string.IsNullOrWhiteSpace(examDescription)
                ? "توضیحاتی برای این آزمون ثبت نشده است."
                : examDescription,
            ["levelLabel"] = levelLabel,
            ["durationLabel"] = durationLabel,
            ["deadlineLabel"] = deadlineLabel,
            ["examsLink"] = link,
        }, cancellationToken);
    }

    public Task SendExamSubmittedToTeacherAsync(
        string toEmail,
        string recipientName,
        string studentName,
        string examTitle,
        string durationLabel,
        string questionCountLabel,
        string gradingLink,
        CancellationToken cancellationToken = default)
    {
        var link = gradingLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? gradingLink
            : $"{ClientBaseUrl}{(gradingLink.StartsWith('/') ? gradingLink : $"/{gradingLink}")}";

        return sender.SendAsync(EmailTemplateKeys.ExamSubmittedTeacher, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["studentName"] = studentName,
            ["examTitle"] = examTitle,
            ["durationLabel"] = durationLabel,
            ["questionCountLabel"] = questionCountLabel,
            ["gradingLink"] = link,
        }, cancellationToken);
    }

    public Task SendEducationPlanInstallmentDueStudentAsync(
        string toEmail,
        string recipientName,
        string planTitle,
        int installmentNumber,
        int offsetDays,
        string amountLabel,
        string dueDateLabel,
        string paymentLink,
        CancellationToken cancellationToken = default)
    {
        var link = paymentLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? paymentLink
            : $"{ClientBaseUrl}{(paymentLink.StartsWith('/') ? paymentLink : $"/{paymentLink}")}";

        var dueMessage = BuildEducationPlanDueMessageForStudent(planTitle, installmentNumber, offsetDays);

        return sender.SendAsync(EmailTemplateKeys.EducationPlanInstallmentDueStudent, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["planTitle"] = planTitle,
            ["installmentNumber"] = installmentNumber.ToString(),
            ["offsetDays"] = offsetDays.ToString(),
            ["dueMessage"] = dueMessage,
            ["amountLabel"] = amountLabel,
            ["dueDateLabel"] = dueDateLabel,
            ["paymentLink"] = link,
        }, cancellationToken);
    }

    public Task SendEducationPlanInstallmentDueTeacherAsync(
        string toEmail,
        string recipientName,
        string studentName,
        string planTitle,
        int installmentNumber,
        int offsetDays,
        string amountLabel,
        string dueDateLabel,
        CancellationToken cancellationToken = default)
    {
        var dueMessage = BuildEducationPlanDueMessageForTeacher(studentName, planTitle, installmentNumber, offsetDays);

        return sender.SendAsync(EmailTemplateKeys.EducationPlanInstallmentDueTeacher, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["studentName"] = studentName,
            ["planTitle"] = planTitle,
            ["installmentNumber"] = installmentNumber.ToString(),
            ["offsetDays"] = offsetDays.ToString(),
            ["dueMessage"] = dueMessage,
            ["amountLabel"] = amountLabel,
            ["dueDateLabel"] = dueDateLabel,
        }, cancellationToken);
    }

    private static string BuildEducationPlanDueMessageForStudent(string planTitle, int installmentNumber, int offsetDays) =>
        offsetDays switch
        {
            < 0 => $"تاریخ پرداخت قسط {installmentNumber} پلن <strong>{planTitle}</strong> تا {-offsetDays} روز دیگر فرا می‌رسد. لطفاً برای پرداخت اقدام کنید.",
            > 0 => $"مهلت پرداخت قسط {installmentNumber} پلن <strong>{planTitle}</strong> {offsetDays} روز پیش سررسید شده است. لطفاً هرچه سریع‌تر پرداخت کنید.",
            _ => $"تاریخ پرداخت قسط {installmentNumber} پلن <strong>{planTitle}</strong> امروز است. لطفاً برای پرداخت اقدام کنید.",
        };

    private static string BuildEducationPlanDueMessageForTeacher(string studentName, string planTitle, int installmentNumber, int offsetDays) =>
        offsetDays switch
        {
            < 0 => $"موعد سررسید قسط {installmentNumber} دانشجو <strong>{studentName}</strong> برای پلن «{planTitle}» تا {-offsetDays} روز دیگر است.",
            > 0 => $"موعد سررسید قسط {installmentNumber} دانشجو <strong>{studentName}</strong> برای پلن «{planTitle}» {offsetDays} روز پیش گذشته است.",
            _ => $"موعد سررسید قسط {installmentNumber} دانشجو <strong>{studentName}</strong> برای پلن «{planTitle}» امروز است.",
        };

    public Task SendSeminarRegistrationAsync(
        string toEmail,
        string recipientName,
        string seminarTitle,
        string amountLabel,
        string? paymentReference,
        CancellationToken cancellationToken = default)
        => sender.SendAsync(EmailTemplateKeys.SeminarRegistrationInvoice, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["seminarTitle"] = seminarTitle,
            ["amountLabel"] = amountLabel,
            ["paymentReference"] = paymentReference ?? "—"
        }, cancellationToken);

    public Task SendSeminarOnlineAccessAsync(
        string toEmail,
        string recipientName,
        string seminarTitle,
        string roomLink,
        string roomUserName,
        string roomPassword,
        CancellationToken cancellationToken = default)
        => sender.SendAsync(EmailTemplateKeys.SeminarOnlineAccess, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["seminarTitle"] = seminarTitle,
            ["roomLink"] = roomLink,
            ["roomUserName"] = roomUserName,
            ["roomPassword"] = roomPassword
        }, cancellationToken);

    public Task SendTeacherAdPlanAsync(
        string toEmail,
        string recipientName,
        string planName,
        string amountLabel,
        string expiryDate,
        CancellationToken cancellationToken = default)
        => sender.SendAsync(EmailTemplateKeys.TeacherAdPlanPurchase, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["planName"] = planName,
            ["amountLabel"] = amountLabel,
            ["expiryDate"] = expiryDate,
            ["dashboardLink"] = $"{ClientBaseUrl}/teacher/advertising"
        }, cancellationToken);

    public Task SendTeacherAutoBumpAsync(
        string toEmail,
        string recipientName,
        string packageName,
        string amountLabel,
        string bumpCount,
        CancellationToken cancellationToken = default)
        => sender.SendAsync(EmailTemplateKeys.TeacherAutoBumpPurchase, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["packageName"] = packageName,
            ["amountLabel"] = amountLabel,
            ["bumpCount"] = bumpCount,
            ["dashboardLink"] = $"{ClientBaseUrl}/teacher/advertising"
        }, cancellationToken);

    public Task SendStudentSupportPlanAsync(
        string toEmail,
        string recipientName,
        string planName,
        string amountLabel,
        string expiryDate,
        CancellationToken cancellationToken = default)
        => sender.SendAsync(EmailTemplateKeys.StudentSupportPlanPurchase, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["planName"] = planName,
            ["amountLabel"] = amountLabel,
            ["expiryDate"] = expiryDate,
            ["dashboardLink"] = ClientBaseUrl
        }, cancellationToken);

    public Task SendPasswordResetAsync(
        string toEmail,
        string recipientName,
        string resetLink,
        int expiryMinutes,
        CancellationToken cancellationToken = default)
        => sender.SendAsync(EmailTemplateKeys.PasswordReset, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["resetLink"] = resetLink,
            ["expiryMinutes"] = EmailLayout.ToPersianDigits(expiryMinutes)
        }, cancellationToken);

    public Task SendTeacherSharedFileDownloadedAsync(
        string toEmail,
        string recipientName,
        string studentFullName,
        string fileTitle,
        CancellationToken cancellationToken = default)
        => sender.SendAsync(EmailTemplateKeys.TeacherSharedFileDownloaded, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["studentFullName"] = studentFullName,
            ["fileTitle"] = fileTitle,
            ["dashboardLink"] = $"{ClientBaseUrl}/professor/online-rooms"
        }, cancellationToken);

    public Task SendTeacherCoursePurchaseAsync(
        string toEmail,
        string recipientName,
        string studentName,
        string courseTitle,
        string earningsLink,
        CancellationToken cancellationToken = default)
    {
        var link = ToAbsolute(earningsLink);
        return sender.SendAsync(EmailTemplateKeys.TeacherCoursePurchase, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["studentName"] = studentName,
            ["courseTitle"] = courseTitle,
            ["earningsLink"] = link
        }, cancellationToken);
    }

    public Task SendTeacherDesktopLicenseRequestAsync(
        string toEmail,
        string recipientName,
        string studentName,
        string courseTitle,
        string studentsLink,
        CancellationToken cancellationToken = default)
    {
        var link = ToAbsolute(studentsLink);
        return sender.SendAsync(EmailTemplateKeys.TeacherDesktopLicenseRequest, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["studentName"] = studentName,
            ["courseTitle"] = courseTitle,
            ["studentsLink"] = link
        }, cancellationToken);
    }

    public Task SendStudentDesktopLicenseIssuedAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string teacherName,
        string licenseKey,
        string accessLabel,
        string durationLabel,
        string desktopDownloadUrl,
        string accessLink,
        CancellationToken cancellationToken = default)
    {
        return sender.SendAsync(EmailTemplateKeys.StudentDesktopLicenseIssued, toEmail, recipientName, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["courseTitle"] = courseTitle,
            ["teacherName"] = teacherName,
            ["licenseKey"] = licenseKey,
            ["accessLabel"] = accessLabel,
            ["durationLabel"] = durationLabel,
            ["desktopDownloadUrl"] = ToAbsolute(desktopDownloadUrl),
            ["accessLink"] = ToAbsolute(accessLink)
        }, cancellationToken);
    }

    private string ToAbsolute(string pathOrUrl)
    {
        if (string.IsNullOrWhiteSpace(pathOrUrl))
            return ClientBaseUrl;
        if (pathOrUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            return pathOrUrl;
        return $"{ClientBaseUrl}{(pathOrUrl.StartsWith('/') ? pathOrUrl : $"/{pathOrUrl}")}";
    }
}
