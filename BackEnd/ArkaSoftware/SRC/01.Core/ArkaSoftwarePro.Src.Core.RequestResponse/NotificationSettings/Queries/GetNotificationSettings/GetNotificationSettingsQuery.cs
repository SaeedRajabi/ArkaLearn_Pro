using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.NotificationSettings.Queries.GetNotificationSettings;

public class GetNotificationSettingsQuery : IQuery<NotificationSettingsQri>, IWebRequest
{
    public string Path => "/api/Service/NotificationSettings/Get";
}

public class NotificationSettingsQri
{
    public bool IsEnabled { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public bool HasApiKey { get; set; }
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
    public int SupportChatUnreadSmsDelayMinutes { get; set; }
    public string SupportChatNotificationSoundKey { get; set; } = string.Empty;
    public bool StudentSharedFileSmsEnabled { get; set; }
    public int StudentSharedFileVerifyTemplateId { get; set; }
    public string StudentSharedFileMessageTemplate { get; set; } = string.Empty;
    public bool TeacherSharedFileDownloadedEnabled { get; set; }
    public int TeacherSharedFileDownloadedVerifyTemplateId { get; set; }
    public string TeacherSharedFileDownloadedMessageTemplate { get; set; } = string.Empty;
    public int OtpExpiryMinutes { get; set; }
    public int OtpResendCooldownSeconds { get; set; }
    public decimal? Credit { get; set; }
    public bool CalendarEventSmsEnabled { get; set; }
    public int CalendarEventVerifyTemplateId { get; set; }
    public string CalendarEventMessageTemplate { get; set; } = string.Empty;
    public string CalendarEventReminderMinutesJson { get; set; } = "[60,30]";
    public string EducationPlanInstallmentReminderRulesJson { get; set; } =
        "[{\"offsetDays\":-1,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":true}," +
        "{\"offsetDays\":0,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":false}]";
}
