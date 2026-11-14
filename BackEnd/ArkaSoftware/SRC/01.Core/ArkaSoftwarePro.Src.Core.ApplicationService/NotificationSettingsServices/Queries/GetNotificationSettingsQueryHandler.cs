using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings.NotificationSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.RequestResponse.NotificationSettings.Queries.GetNotificationSettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using RepoNotificationSettingsQri = ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings.NotificationSettingsRepositoryContracts.Queries.NotificationSettingsQri;
using ResponseNotificationSettingsQri = ArkaSoftwarePro.Src.Core.RequestResponse.NotificationSettings.Queries.GetNotificationSettings.NotificationSettingsQri;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.NotificationSettingsServices.Queries;

public class GetNotificationSettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsQueryRepository repository,
    ISmsIrClient smsIrClient)
    : QueryHandler<GetNotificationSettingsQuery, ResponseNotificationSettingsQri>(outer)
{
    public override async Task<QueryResult<ResponseNotificationSettingsQri>> Handle(GetNotificationSettingsQuery query)
    {
        RepoNotificationSettingsQri? row = await repository.GetCurrentAsync();
        if (row is null)
            return await ResultAsync(new ResponseNotificationSettingsQri(), ApplicationServiceStatus.Ok);

        decimal? credit = null;
        if (row.IsEnabled && row.HasApiKey)
        {
            try { credit = await smsIrClient.GetCreditAsync(); }
            catch { /* ignore credit probe errors */ }
        }

        return await ResultAsync(new ResponseNotificationSettingsQri        {
            IsEnabled = row.IsEnabled,
            ApiKey = string.Empty,
            HasApiKey = row.HasApiKey,
            LineNumber = row.LineNumber,
            RegistrationOtpEnabled = row.RegistrationOtpEnabled,
            RegistrationVerifyTemplateId = row.RegistrationVerifyTemplateId,
            PhoneChangeOtpEnabled = row.PhoneChangeOtpEnabled,
            PhoneChangeVerifyTemplateId = row.PhoneChangeVerifyTemplateId,
            EducationPlanSmsEnabled = row.EducationPlanSmsEnabled,
            EducationPlanVerifyTemplateId = row.EducationPlanVerifyTemplateId,
            EducationPlanMessageTemplate = row.EducationPlanMessageTemplate,
            EducationPlanRemovedVerifyTemplateId = row.EducationPlanRemovedVerifyTemplateId,
            EducationPlanRemovedMessageTemplate = row.EducationPlanRemovedMessageTemplate,
            EducationPlanInstallmentDueVerifyTemplateId = row.EducationPlanInstallmentDueVerifyTemplateId,
            EducationPlanInstallmentDueMessageTemplate = row.EducationPlanInstallmentDueMessageTemplate,
            SupportChatSmsEnabled = row.SupportChatSmsEnabled,
            SupportChatVerifyTemplateId = row.SupportChatVerifyTemplateId,
            SupportChatMessageTemplate = row.SupportChatMessageTemplate,
            SupportChatStudentUnreadVerifyTemplateId = row.SupportChatStudentUnreadVerifyTemplateId,
            SupportChatStudentUnreadMessageTemplate = row.SupportChatStudentUnreadMessageTemplate,
            SupportChatUnreadSmsDelayMinutes = row.SupportChatUnreadSmsDelayMinutes,
            SupportChatNotificationSoundKey = row.SupportChatNotificationSoundKey,
            StudentSharedFileSmsEnabled = row.StudentSharedFileSmsEnabled,
            StudentSharedFileVerifyTemplateId = row.StudentSharedFileVerifyTemplateId,
            StudentSharedFileMessageTemplate = row.StudentSharedFileMessageTemplate,
            TeacherSharedFileDownloadedEnabled = row.TeacherSharedFileDownloadedEnabled,
            TeacherSharedFileDownloadedVerifyTemplateId = row.TeacherSharedFileDownloadedVerifyTemplateId,
            TeacherSharedFileDownloadedMessageTemplate = row.TeacherSharedFileDownloadedMessageTemplate,
            CalendarEventSmsEnabled = row.CalendarEventSmsEnabled,
            CalendarEventVerifyTemplateId = row.CalendarEventVerifyTemplateId,
            CalendarEventMessageTemplate = row.CalendarEventMessageTemplate,
            CalendarEventReminderMinutesJson = row.CalendarEventReminderMinutesJson,
            EducationPlanInstallmentReminderRulesJson = string.IsNullOrWhiteSpace(row.EducationPlanInstallmentReminderRulesJson)
                ? "[{\"offsetDays\":-1,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":true},{\"offsetDays\":0,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":false}]"
                : row.EducationPlanInstallmentReminderRulesJson,
            OtpExpiryMinutes = row.OtpExpiryMinutes,
            OtpResendCooldownSeconds = row.OtpResendCooldownSeconds,
            Credit = credit
        }, ApplicationServiceStatus.Ok);
    }
}
