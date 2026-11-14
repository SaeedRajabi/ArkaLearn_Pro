using ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;
using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings.NotificationSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.NotificationSettings.Commands.UpsertNotificationSettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using NotificationSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.NotificationSettingsServices.Commands;

public class UpsertNotificationSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsCommandRepository repository,
    CalendarEventReminderService calendarEventReminderService)
    : CommandHandler<UpsertNotificationSettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertNotificationSettingsCommand command)
    {
        var current = await repository.GetCurrentAsync();
        var previousReminderJson = current?.CalendarEventReminderMinutesJson;
        var previousCalendarSmsEnabled = current?.CalendarEventSmsEnabled;
        var apiKey = string.IsNullOrWhiteSpace(command.ApiKey)
            ? current?.ApiKey ?? string.Empty
            : command.ApiKey.Trim();

        var reminderJson = CalendarEventReminderSchedule.Serialize(
            CalendarEventReminderSchedule.Parse(command.CalendarEventReminderMinutesJson));

        if (current is null)
        {
            current = new NotificationSettingsEntity(
                command.IsEnabled,
                apiKey,
                command.LineNumber,
                command.RegistrationOtpEnabled,
                command.RegistrationVerifyTemplateId,
                command.PhoneChangeOtpEnabled,
                command.PhoneChangeVerifyTemplateId,
                command.EducationPlanSmsEnabled,
                command.EducationPlanVerifyTemplateId,
                command.EducationPlanMessageTemplate,
                command.EducationPlanRemovedVerifyTemplateId,
                command.EducationPlanRemovedMessageTemplate,
                command.EducationPlanInstallmentDueVerifyTemplateId,
                command.EducationPlanInstallmentDueMessageTemplate,
                command.SupportChatSmsEnabled,
                command.SupportChatVerifyTemplateId,
                command.SupportChatMessageTemplate,
                command.SupportChatStudentUnreadVerifyTemplateId,
                command.SupportChatStudentUnreadMessageTemplate,
                command.SupportChatUnreadSmsDelayMinutes,
                command.SupportChatNotificationSoundKey,
                command.StudentSharedFileSmsEnabled,
                command.StudentSharedFileVerifyTemplateId,
                command.StudentSharedFileMessageTemplate,
                command.TeacherSharedFileDownloadedEnabled,
                command.TeacherSharedFileDownloadedVerifyTemplateId,
                command.TeacherSharedFileDownloadedMessageTemplate,
                command.CalendarEventSmsEnabled,
                command.CalendarEventVerifyTemplateId,
                command.CalendarEventMessageTemplate,
                reminderJson,
                command.OtpExpiryMinutes,
                command.OtpResendCooldownSeconds);
            await repository.InsertAsync(current);
        }
        else
        {
            current.Update(
                command.IsEnabled,
                apiKey,
                command.LineNumber,
                command.RegistrationOtpEnabled,
                command.RegistrationVerifyTemplateId,
                command.PhoneChangeOtpEnabled,
                command.PhoneChangeVerifyTemplateId,
                command.EducationPlanSmsEnabled,
                command.EducationPlanVerifyTemplateId,
                command.EducationPlanMessageTemplate,
                command.EducationPlanRemovedVerifyTemplateId,
                command.EducationPlanRemovedMessageTemplate,
                command.EducationPlanInstallmentDueVerifyTemplateId,
                command.EducationPlanInstallmentDueMessageTemplate,
                command.SupportChatSmsEnabled,
                command.SupportChatVerifyTemplateId,
                command.SupportChatMessageTemplate,
                command.SupportChatStudentUnreadVerifyTemplateId,
                command.SupportChatStudentUnreadMessageTemplate,
                command.SupportChatUnreadSmsDelayMinutes,
                command.SupportChatNotificationSoundKey,
                command.StudentSharedFileSmsEnabled,
                command.StudentSharedFileVerifyTemplateId,
                command.StudentSharedFileMessageTemplate,
                command.TeacherSharedFileDownloadedEnabled,
                command.TeacherSharedFileDownloadedVerifyTemplateId,
                command.TeacherSharedFileDownloadedMessageTemplate,
                command.CalendarEventSmsEnabled,
                command.CalendarEventVerifyTemplateId,
                command.CalendarEventMessageTemplate,
                reminderJson,
                command.OtpExpiryMinutes,
                command.OtpResendCooldownSeconds);
        }

        await repository.CommitAsync();

        current.SetEducationPlanInstallmentReminderRules(command.EducationPlanInstallmentReminderRulesJson);
        await repository.CommitAsync();

        var calendarSettingsChanged =
            previousCalendarSmsEnabled != command.CalendarEventSmsEnabled ||
            !string.Equals(
                CalendarEventReminderSchedule.Serialize(CalendarEventReminderSchedule.Parse(previousReminderJson)),
                reminderJson,
                StringComparison.Ordinal);

        if (calendarSettingsChanged && command.CalendarEventSmsEnabled)
        {
            await calendarEventReminderService.RescheduleAllUpcomingEventsAsync();
        }

        return await OkAsync("Notification settings saved.");
    }
}
