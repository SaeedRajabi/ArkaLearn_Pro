using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public static class EmailTemplateCatalog
{
    private static readonly IReadOnlyList<EmailTemplateDefinitionDto> Defaults =
    [
        Define(VerificationCodeTemplate.Key, VerificationCodeTemplate.DisplayName, VerificationCodeTemplate.Description, VerificationCodeTemplate.Subject, VerificationCodeTemplate.Body),
        Define(WelcomeStudentTemplate.Key, WelcomeStudentTemplate.DisplayName, WelcomeStudentTemplate.Description, WelcomeStudentTemplate.Subject, WelcomeStudentTemplate.Body),
        Define(WelcomeTeacherTemplate.Key, WelcomeTeacherTemplate.DisplayName, WelcomeTeacherTemplate.Description, WelcomeTeacherTemplate.Subject, WelcomeTeacherTemplate.Body),
        Define(CoursePurchaseInvoiceTemplate.Key, CoursePurchaseInvoiceTemplate.DisplayName, CoursePurchaseInvoiceTemplate.Description, CoursePurchaseInvoiceTemplate.Subject, CoursePurchaseInvoiceTemplate.Body),
        Define(CourseOnlineAccessTemplate.Key, CourseOnlineAccessTemplate.DisplayName, CourseOnlineAccessTemplate.Description, CourseOnlineAccessTemplate.Subject, CourseOnlineAccessTemplate.Body),
        Define(CourseEnrollmentLicenseTemplate.Key, CourseEnrollmentLicenseTemplate.DisplayName, CourseEnrollmentLicenseTemplate.Description, CourseEnrollmentLicenseTemplate.Subject, CourseEnrollmentLicenseTemplate.Body),
        Define(CourseInstallmentDueTemplate.Key, CourseInstallmentDueTemplate.DisplayName, CourseInstallmentDueTemplate.Description, CourseInstallmentDueTemplate.Subject, CourseInstallmentDueTemplate.Body),
        Define(EducationPlanAssignedTemplate.Key, EducationPlanAssignedTemplate.DisplayName, EducationPlanAssignedTemplate.Description, EducationPlanAssignedTemplate.Subject, EducationPlanAssignedTemplate.Body),
        Define(EducationPlanInstallmentDueStudentTemplate.Key, EducationPlanInstallmentDueStudentTemplate.DisplayName, EducationPlanInstallmentDueStudentTemplate.Description, EducationPlanInstallmentDueStudentTemplate.Subject, EducationPlanInstallmentDueStudentTemplate.Body),
        Define(EducationPlanInstallmentDueTeacherTemplate.Key, EducationPlanInstallmentDueTeacherTemplate.DisplayName, EducationPlanInstallmentDueTeacherTemplate.Description, EducationPlanInstallmentDueTeacherTemplate.Subject, EducationPlanInstallmentDueTeacherTemplate.Body),
        Define(SeminarRegistrationInvoiceTemplate.Key, SeminarRegistrationInvoiceTemplate.DisplayName, SeminarRegistrationInvoiceTemplate.Description, SeminarRegistrationInvoiceTemplate.Subject, SeminarRegistrationInvoiceTemplate.Body),
        Define(SeminarOnlineAccessTemplate.Key, SeminarOnlineAccessTemplate.DisplayName, SeminarOnlineAccessTemplate.Description, SeminarOnlineAccessTemplate.Subject, SeminarOnlineAccessTemplate.Body),
        Define(TeacherAdPlanPurchaseTemplate.Key, TeacherAdPlanPurchaseTemplate.DisplayName, TeacherAdPlanPurchaseTemplate.Description, TeacherAdPlanPurchaseTemplate.Subject, TeacherAdPlanPurchaseTemplate.Body),
        Define(TeacherAutoBumpPurchaseTemplate.Key, TeacherAutoBumpPurchaseTemplate.DisplayName, TeacherAutoBumpPurchaseTemplate.Description, TeacherAutoBumpPurchaseTemplate.Subject, TeacherAutoBumpPurchaseTemplate.Body),
        Define(StudentSupportPlanPurchaseTemplate.Key, StudentSupportPlanPurchaseTemplate.DisplayName, StudentSupportPlanPurchaseTemplate.Description, StudentSupportPlanPurchaseTemplate.Subject, StudentSupportPlanPurchaseTemplate.Body),
        Define(PasswordResetTemplate.Key, PasswordResetTemplate.DisplayName, PasswordResetTemplate.Description, PasswordResetTemplate.Subject, PasswordResetTemplate.Body),
        Define(RoomCredentialsTemplate.Key, RoomCredentialsTemplate.DisplayName, RoomCredentialsTemplate.Description, RoomCredentialsTemplate.Subject, RoomCredentialsTemplate.Body),
        Define(ContactReplyTemplate.Key, ContactReplyTemplate.DisplayName, ContactReplyTemplate.Description, ContactReplyTemplate.Subject, ContactReplyTemplate.Body),
        Define(PlatformTicketViewedTemplate.Key, PlatformTicketViewedTemplate.DisplayName, PlatformTicketViewedTemplate.Description, PlatformTicketViewedTemplate.Subject, PlatformTicketViewedTemplate.Body),
        Define(PlatformTicketCreatedAdminTemplate.Key, PlatformTicketCreatedAdminTemplate.DisplayName, PlatformTicketCreatedAdminTemplate.Description, PlatformTicketCreatedAdminTemplate.Subject, PlatformTicketCreatedAdminTemplate.Body),
        Define(PlatformTicketRepliedTemplate.Key, PlatformTicketRepliedTemplate.DisplayName, PlatformTicketRepliedTemplate.Description, PlatformTicketRepliedTemplate.Subject, PlatformTicketRepliedTemplate.Body),
        Define(TeacherSharedFileDownloadedTemplate.Key, TeacherSharedFileDownloadedTemplate.DisplayName, TeacherSharedFileDownloadedTemplate.Description, TeacherSharedFileDownloadedTemplate.Subject, TeacherSharedFileDownloadedTemplate.Body),
        Define(NewsletterNewContentTemplate.Key, NewsletterNewContentTemplate.DisplayName, NewsletterNewContentTemplate.Description, NewsletterNewContentTemplate.Subject, NewsletterNewContentTemplate.Body),
        Define(TeacherCoursePurchaseTemplate.Key, TeacherCoursePurchaseTemplate.DisplayName, TeacherCoursePurchaseTemplate.Description, TeacherCoursePurchaseTemplate.Subject, TeacherCoursePurchaseTemplate.Body),
        Define(TeacherDesktopLicenseRequestTemplate.Key, TeacherDesktopLicenseRequestTemplate.DisplayName, TeacherDesktopLicenseRequestTemplate.Description, TeacherDesktopLicenseRequestTemplate.Subject, TeacherDesktopLicenseRequestTemplate.Body),
        Define(StudentDesktopLicenseIssuedTemplate.Key, StudentDesktopLicenseIssuedTemplate.DisplayName, StudentDesktopLicenseIssuedTemplate.Description, StudentDesktopLicenseIssuedTemplate.Subject, StudentDesktopLicenseIssuedTemplate.Body),
        Define(ExamAssignedTemplate.Key, ExamAssignedTemplate.DisplayName, ExamAssignedTemplate.Description, ExamAssignedTemplate.Subject, ExamAssignedTemplate.Body),
        Define(ExamSubmittedTeacherTemplate.Key, ExamSubmittedTeacherTemplate.DisplayName, ExamSubmittedTeacherTemplate.Description, ExamSubmittedTeacherTemplate.Subject, ExamSubmittedTeacherTemplate.Body)
    ];

    private static readonly Dictionary<string, EmailTemplateDefinitionDto> Lookup =
        Defaults.ToDictionary(x => x.TemplateKey, StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyList<EmailTemplateDefinitionDto> GetAll() => Defaults;

    public static EmailTemplateDefinitionDto GetRequired(string templateKey)
    {
        if (Lookup.TryGetValue(templateKey, out var definition))
            return definition;
        throw new KeyNotFoundException($"Unknown email template key: {templateKey}");
    }

    public static bool TryGet(string templateKey, out EmailTemplateDefinitionDto definition)
        => Lookup.TryGetValue(templateKey, out definition!);

    public static EmailTemplateContent ToContent(EmailTemplateDefinitionDto definition, bool isCustomized = false)
        => new()
        {
            TemplateKey = definition.TemplateKey,
            DisplayName = definition.DisplayName,
            Description = definition.Description,
            Subject = definition.Subject,
            BodyHtml = definition.BodyHtml,
            IsEnabled = true,
            IsCustomized = isCustomized
        };

    private static EmailTemplateDefinitionDto Define(
        string key,
        string displayName,
        string description,
        string subject,
        string body)
        => new()
        {
            TemplateKey = key,
            DisplayName = displayName,
            Description = description,
            Subject = subject,
            BodyHtml = body
        };
}

public sealed class EmailTemplateCatalogService : IEmailTemplateCatalog
{
    public IReadOnlyList<EmailTemplateDefinitionDto> GetAll() => EmailTemplateCatalog.GetAll();

    public EmailTemplateDefinitionDto GetRequired(string templateKey) => EmailTemplateCatalog.GetRequired(templateKey);

    public bool TryGet(string templateKey, out EmailTemplateDefinitionDto definition)
        => EmailTemplateCatalog.TryGet(templateKey, out definition);
}
