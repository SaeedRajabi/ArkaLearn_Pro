using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings.NotificationSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class NotificationSettingsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), INotificationSettingsQueryRepository
{    public async Task<NotificationSettingsQri?> GetCurrentAsync()
    {
        var row = await dbContext.NotificationSettings.AsNoTracking()
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync();
        if (row is null) return null;
        return new NotificationSettingsQri
        {
            IsEnabled = row.IsEnabled,
            ApiKey = row.ApiKey,
            HasApiKey = !string.IsNullOrWhiteSpace(row.ApiKey),
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
            EducationPlanInstallmentReminderRulesJson = row.EducationPlanInstallmentReminderRulesJson,
            OtpExpiryMinutes = row.OtpExpiryMinutes,
            OtpResendCooldownSeconds = row.OtpResendCooldownSeconds
        };
    }
}
