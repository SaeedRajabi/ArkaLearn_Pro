using Framework.Src.Core.Domain.Aggregates;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate;

namespace ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities;

public class NotificationSettings : AggregateRoot
{
    public bool IsEnabled { get; private set; }
    public string ApiKey { get; private set; } = string.Empty;
    public long LineNumber { get; private set; }
    public bool RegistrationOtpEnabled { get; private set; }
    public int RegistrationVerifyTemplateId { get; private set; }
    public bool PhoneChangeOtpEnabled { get; private set; }
    public int PhoneChangeVerifyTemplateId { get; private set; }
    public bool EducationPlanSmsEnabled { get; private set; }
    public int EducationPlanVerifyTemplateId { get; private set; }
    public string EducationPlanMessageTemplate { get; private set; } = string.Empty;
    public int EducationPlanRemovedVerifyTemplateId { get; private set; }
    public string EducationPlanRemovedMessageTemplate { get; private set; } = string.Empty;
    public int EducationPlanInstallmentDueVerifyTemplateId { get; private set; }
    public string EducationPlanInstallmentDueMessageTemplate { get; private set; } = string.Empty;
    public bool SupportChatSmsEnabled { get; private set; }
    public int SupportChatVerifyTemplateId { get; private set; }
    public string SupportChatMessageTemplate { get; private set; } = string.Empty;
    public int SupportChatStudentUnreadVerifyTemplateId { get; private set; }
    public string SupportChatStudentUnreadMessageTemplate { get; private set; } = string.Empty;
    public int SupportChatUnreadSmsDelayMinutes { get; private set; } = 20;
    public string SupportChatNotificationSoundKey { get; private set; } = "chime";
    public bool StudentSharedFileSmsEnabled { get; private set; }
    public int StudentSharedFileVerifyTemplateId { get; private set; }
    public string StudentSharedFileMessageTemplate { get; private set; } = string.Empty;
    public bool TeacherSharedFileDownloadedEnabled { get; private set; }
    public int TeacherSharedFileDownloadedVerifyTemplateId { get; private set; }
    public string TeacherSharedFileDownloadedMessageTemplate { get; private set; } = string.Empty;
    public bool CalendarEventSmsEnabled { get; private set; }
    public int CalendarEventVerifyTemplateId { get; private set; }
    public string CalendarEventMessageTemplate { get; private set; } = string.Empty;
    public string CalendarEventReminderMinutesJson { get; private set; } = "[60,30]";
    /// <summary>
    /// JSON reminder rules for private education-plan installments
    /// (offsetDays + student SMS/email + teacher email flags).
    /// </summary>
    public string EducationPlanInstallmentReminderRulesJson { get; private set; } =
        "[{" +
        "\"offsetDays\":-1,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":true}," +
        "{\"offsetDays\":0,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":false}]";
    public int OtpExpiryMinutes { get; private set; } = 10;
    public int OtpResendCooldownSeconds { get; private set; } = 120;

    private NotificationSettings()
    {
    }

    public NotificationSettings(
        bool isEnabled,
        string apiKey,
        long lineNumber,
        bool registrationOtpEnabled,
        int registrationVerifyTemplateId,
        bool phoneChangeOtpEnabled,
        int phoneChangeVerifyTemplateId,
        bool educationPlanSmsEnabled,
        int educationPlanVerifyTemplateId,
        string educationPlanMessageTemplate,
        int educationPlanRemovedVerifyTemplateId,
        string educationPlanRemovedMessageTemplate,
        int educationPlanInstallmentDueVerifyTemplateId,
        string educationPlanInstallmentDueMessageTemplate,
        bool supportChatSmsEnabled,
        int supportChatVerifyTemplateId,
        string supportChatMessageTemplate,
        int supportChatStudentUnreadVerifyTemplateId,
        string supportChatStudentUnreadMessageTemplate,
        int supportChatUnreadSmsDelayMinutes,
        string supportChatNotificationSoundKey,
        bool studentSharedFileSmsEnabled,
        int studentSharedFileVerifyTemplateId,
        string studentSharedFileMessageTemplate,
        bool teacherSharedFileDownloadedEnabled,
        int teacherSharedFileDownloadedVerifyTemplateId,
        string teacherSharedFileDownloadedMessageTemplate,
        bool calendarEventSmsEnabled,
        int calendarEventVerifyTemplateId,
        string calendarEventMessageTemplate,
        string calendarEventReminderMinutesJson,
        int otpExpiryMinutes,
        int otpResendCooldownSeconds)
    {
        Update(
            isEnabled,
            apiKey,
            lineNumber,
            registrationOtpEnabled,
            registrationVerifyTemplateId,
            phoneChangeOtpEnabled,
            phoneChangeVerifyTemplateId,
            educationPlanSmsEnabled,
            educationPlanVerifyTemplateId,
            educationPlanMessageTemplate,
            educationPlanRemovedVerifyTemplateId,
            educationPlanRemovedMessageTemplate,
            educationPlanInstallmentDueVerifyTemplateId,
            educationPlanInstallmentDueMessageTemplate,
            supportChatSmsEnabled,
            supportChatVerifyTemplateId,
            supportChatMessageTemplate,
            supportChatStudentUnreadVerifyTemplateId,
            supportChatStudentUnreadMessageTemplate,
            supportChatUnreadSmsDelayMinutes,
            supportChatNotificationSoundKey,
            studentSharedFileSmsEnabled,
            studentSharedFileVerifyTemplateId,
            studentSharedFileMessageTemplate,
            teacherSharedFileDownloadedEnabled,
            teacherSharedFileDownloadedVerifyTemplateId,
            teacherSharedFileDownloadedMessageTemplate,
            calendarEventSmsEnabled,
            calendarEventVerifyTemplateId,
            calendarEventMessageTemplate,
            calendarEventReminderMinutesJson,
            otpExpiryMinutes,
            otpResendCooldownSeconds);
    }

    public void Update(
        bool isEnabled,
        string apiKey,
        long lineNumber,
        bool registrationOtpEnabled,
        int registrationVerifyTemplateId,
        bool phoneChangeOtpEnabled,
        int phoneChangeVerifyTemplateId,
        bool educationPlanSmsEnabled,
        int educationPlanVerifyTemplateId,
        string educationPlanMessageTemplate,
        int educationPlanRemovedVerifyTemplateId,
        string educationPlanRemovedMessageTemplate,
        int educationPlanInstallmentDueVerifyTemplateId,
        string educationPlanInstallmentDueMessageTemplate,
        bool supportChatSmsEnabled,
        int supportChatVerifyTemplateId,
        string supportChatMessageTemplate,
        int supportChatStudentUnreadVerifyTemplateId,
        string supportChatStudentUnreadMessageTemplate,
        int supportChatUnreadSmsDelayMinutes,
        string supportChatNotificationSoundKey,
        bool studentSharedFileSmsEnabled,
        int studentSharedFileVerifyTemplateId,
        string studentSharedFileMessageTemplate,
        bool teacherSharedFileDownloadedEnabled,
        int teacherSharedFileDownloadedVerifyTemplateId,
        string teacherSharedFileDownloadedMessageTemplate,
        bool calendarEventSmsEnabled,
        int calendarEventVerifyTemplateId,
        string calendarEventMessageTemplate,
        string calendarEventReminderMinutesJson,
        int otpExpiryMinutes,
        int otpResendCooldownSeconds)
    {
        IsEnabled = isEnabled;
        ApiKey = apiKey?.Trim() ?? string.Empty;
        LineNumber = lineNumber;
        RegistrationOtpEnabled = registrationOtpEnabled;
        RegistrationVerifyTemplateId = registrationVerifyTemplateId;
        PhoneChangeOtpEnabled = phoneChangeOtpEnabled;
        PhoneChangeVerifyTemplateId = phoneChangeVerifyTemplateId;
        EducationPlanSmsEnabled = educationPlanSmsEnabled;
        EducationPlanVerifyTemplateId = educationPlanVerifyTemplateId;
        EducationPlanMessageTemplate = educationPlanMessageTemplate?.Trim() ?? string.Empty;
        EducationPlanRemovedVerifyTemplateId = educationPlanRemovedVerifyTemplateId;
        EducationPlanRemovedMessageTemplate = educationPlanRemovedMessageTemplate?.Trim() ?? string.Empty;
        EducationPlanInstallmentDueVerifyTemplateId = educationPlanInstallmentDueVerifyTemplateId;
        EducationPlanInstallmentDueMessageTemplate = educationPlanInstallmentDueMessageTemplate?.Trim() ?? string.Empty;
        SupportChatSmsEnabled = supportChatSmsEnabled;
        SupportChatVerifyTemplateId = supportChatVerifyTemplateId;
        SupportChatMessageTemplate = supportChatMessageTemplate?.Trim() ?? string.Empty;
        SupportChatStudentUnreadVerifyTemplateId = supportChatStudentUnreadVerifyTemplateId;
        SupportChatStudentUnreadMessageTemplate = supportChatStudentUnreadMessageTemplate?.Trim() ?? string.Empty;
        SupportChatUnreadSmsDelayMinutes = supportChatUnreadSmsDelayMinutes is < 1 or > 120
            ? 20
            : supportChatUnreadSmsDelayMinutes;
        SupportChatNotificationSoundKey = NormalizeSoundKey(supportChatNotificationSoundKey);
        StudentSharedFileSmsEnabled = studentSharedFileSmsEnabled;
        StudentSharedFileVerifyTemplateId = studentSharedFileVerifyTemplateId;
        StudentSharedFileMessageTemplate = studentSharedFileMessageTemplate?.Trim() ?? string.Empty;
        TeacherSharedFileDownloadedEnabled = teacherSharedFileDownloadedEnabled;
        TeacherSharedFileDownloadedVerifyTemplateId = teacherSharedFileDownloadedVerifyTemplateId;
        TeacherSharedFileDownloadedMessageTemplate = string.IsNullOrWhiteSpace(teacherSharedFileDownloadedMessageTemplate)
            ? "دانشجو #FULLNAME# فایل «#TITLE#» را دانلود کرد."
            : teacherSharedFileDownloadedMessageTemplate.Trim();
        CalendarEventSmsEnabled = calendarEventSmsEnabled;
        CalendarEventVerifyTemplateId = calendarEventVerifyTemplateId;
        CalendarEventMessageTemplate = string.IsNullOrWhiteSpace(calendarEventMessageTemplate)
            ? "یادآور آرکا نرم افزار: رویداد شما با عنوان #TITLE# در تاریخ #DATE#، ساعت #TIME# برگزار خواهد شد. تیم پشتیبانی آرکا نرم‌افزار"
            : calendarEventMessageTemplate.Trim();
        CalendarEventReminderMinutesJson = NormalizeReminderMinutesJson(calendarEventReminderMinutesJson);
        OtpExpiryMinutes = otpExpiryMinutes is < 1 or > 60 ? 10 : otpExpiryMinutes;
        OtpResendCooldownSeconds = otpResendCooldownSeconds is < 30 or > 600 ? 120 : otpResendCooldownSeconds;
    }

    public void SetEducationPlanInstallmentReminderRules(string? rulesJson)
    {
        EducationPlanInstallmentReminderRulesJson =
            EducationPlanInstallmentReminderSchedule.Serialize(
                EducationPlanInstallmentReminderSchedule.Parse(rulesJson));
    }

    public bool CanSendSms => IsEnabled && !string.IsNullOrWhiteSpace(ApiKey) && LineNumber > 0;

    private static string NormalizeSoundKey(string? key)
    {
        var normalized = (key ?? "chime").Trim().ToLowerInvariant();
        return normalized is "chime" or "bell" or "pop" or "ping" or "soft" ? normalized : "chime";
    }

    private static string NormalizeReminderMinutesJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return "[60,30]";
        return json.Trim().Length > 500 ? json.Trim()[..500] : json.Trim();
    }
}
