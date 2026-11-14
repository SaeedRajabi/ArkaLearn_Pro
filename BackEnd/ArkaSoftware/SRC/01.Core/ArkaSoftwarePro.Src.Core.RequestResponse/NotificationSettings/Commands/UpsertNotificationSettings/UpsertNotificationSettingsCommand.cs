using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.NotificationSettings.Commands.UpsertNotificationSettings;

public class UpsertNotificationSettingsCommand : ICommand<string>, IWebRequest
{
    public bool IsEnabled { get; set; }
    public string? ApiKey { get; set; }
    public long LineNumber { get; set; }
    public bool RegistrationOtpEnabled { get; set; }
    public int RegistrationVerifyTemplateId { get; set; }
    public bool PhoneChangeOtpEnabled { get; set; }
    public int PhoneChangeVerifyTemplateId { get; set; }
    public bool EducationPlanSmsEnabled { get; set; }
    public int EducationPlanVerifyTemplateId { get; set; }
    public string EducationPlanMessageTemplate { get; set; } = string.Empty;
    public int EducationPlanRemovedVerifyTemplateId { get; set; }
    public string EducationPlanRemovedMessageTemplate { get; set; } = string.Empty;
    public int EducationPlanInstallmentDueVerifyTemplateId { get; set; }
    public string EducationPlanInstallmentDueMessageTemplate { get; set; } = string.Empty;
    public bool SupportChatSmsEnabled { get; set; }
    public int SupportChatVerifyTemplateId { get; set; }
    public string SupportChatMessageTemplate { get; set; } = string.Empty;
    public int SupportChatStudentUnreadVerifyTemplateId { get; set; }
    public string SupportChatStudentUnreadMessageTemplate { get; set; } = string.Empty;
    public int SupportChatUnreadSmsDelayMinutes { get; set; } = 20;
    public string SupportChatNotificationSoundKey { get; set; } = "chime";
    public bool StudentSharedFileSmsEnabled { get; set; }
    public int StudentSharedFileVerifyTemplateId { get; set; }
    public string StudentSharedFileMessageTemplate { get; set; } = string.Empty;
    public bool TeacherSharedFileDownloadedEnabled { get; set; }
    public int TeacherSharedFileDownloadedVerifyTemplateId { get; set; }
    public string TeacherSharedFileDownloadedMessageTemplate { get; set; } = string.Empty;
    public int OtpExpiryMinutes { get; set; } = 10;
    public int OtpResendCooldownSeconds { get; set; } = 120;
    public bool CalendarEventSmsEnabled { get; set; }
    public int CalendarEventVerifyTemplateId { get; set; }
    public string CalendarEventMessageTemplate { get; set; } = string.Empty;
    public string CalendarEventReminderMinutesJson { get; set; } = "[60,30]";
    public string EducationPlanInstallmentReminderRulesJson { get; set; } =
        "[{\"offsetDays\":-1,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":true}," +
        "{\"offsetDays\":0,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":false}]";
    public string Path => "/api/Service/NotificationSettings/Upsert";
}
