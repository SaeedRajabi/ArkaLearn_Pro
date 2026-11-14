using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices;

public class UserFileNotifier(
    IManagedRoomStudentCommandRepository managedRoomStudentRepository,
    IManagedRoomStudentQueryRepository managedRoomStudentQueryRepository,
    IUserQueryRepository userQueryRepository,
    IUserNotificationCommandRepository notificationRepository,
    IEngagementRealtimeNotifier engagementRealtime,
    ISmsNotificationService smsNotificationService,
    ITransactionalEmailNotifier transactionalEmailNotifier,
    INotificationSettingsProvider settingsProvider,
    ILogger<UserFileNotifier> logger)
{
    public const string NotificationType = "student_shared_file_uploaded";
    public const string DownloadNotificationType = "teacher_shared_file_downloaded";

    public const string DefaultMessageTemplate =
        "فایل جلسه با عنوان #TITLE# برای شما بارگذاری شد. 📥\n" +
        "برای دانلود، به بخش \"داشبورد\" و سپس \"فایل‌های اشتراکی\" مراجعه نمایید.\n" +
        " تیم پشتیبانی آرکا نرم‌افزار";

    public const string DefaultDownloadMessageTemplate =
        "دانشجو #FULLNAME# فایل «#TITLE#» را دانلود کرد.";

    public async Task NotifySharedFileUploadedAsync(
        long managedRoomStudentId,
        string fileTitle,
        long fileId,
        CancellationToken cancellationToken = default)
    {
        if (managedRoomStudentId <= 0)
            return;

        var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(managedRoomStudentId);
        if (student is null)
        {
            logger.LogWarning(
                "Skipped shared-file notification because managed student {ManagedStudentId} was not found",
                managedRoomStudentId);
            return;
        }

        var portalContact = await managedRoomStudentQueryRepository.FindPortalContactByManagedStudentIdAsync(
            managedRoomStudentId,
            cancellationToken);

        if (portalContact is not { UserId: > 0 })
        {
            portalContact = await userQueryRepository.GetUserLookupByIdentityAsync(
                    student.UserName.Value,
                    student.Email,
                    cancellationToken) is { UserId: > 0 } lookup
                ? new ManagedStudentPortalContact
                {
                    UserId = lookup.UserId,
                    PhoneNumber = lookup.PhoneNumber,
                }
                : null;
        }

        if (portalContact is not { UserId: > 0 })
        {
            logger.LogWarning(
                "Skipped shared-file notification because portal user was not found for managed student {ManagedStudentId}",
                managedRoomStudentId);
            return;
        }

        var title = string.IsNullOrWhiteSpace(fileTitle) ? "فایل جلسه" : fileTitle.Trim();
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        var template = settings?.StudentSharedFileMessageTemplate;
        if (string.IsNullOrWhiteSpace(template))
            template = DefaultMessageTemplate;

        var body = template.Replace("#TITLE#", title, StringComparison.OrdinalIgnoreCase);

        await notificationRepository.InsertAsync(UserNotification.Create(
            portalContact.UserId,
            "فایل جلسه جدید",
            body,
            NotificationType,
            "/account?view=shared-files",
            fileId));
        await notificationRepository.CommitAsync();
        await engagementRealtime.NotifyUserNotificationAsync(portalContact.UserId);

        await smsNotificationService.TrySendStudentSharedFileAsync(
            managedRoomStudentId,
            title,
            cancellationToken);

        logger.LogInformation(
            "Shared-file notification sent to portal user {PortalUserId} for managed student {ManagedStudentId}, file {FileId}",
            portalContact.UserId,
            managedRoomStudentId,
            fileId);
    }

    public async Task NotifySharedFileDownloadedAsync(
        long managedRoomStudentId,
        string fileTitle,
        long fileId,
        string? studentDisplayName = null,
        long? uploadedByUserId = null,
        CancellationToken cancellationToken = default)
    {
        if (managedRoomStudentId <= 0 || fileId <= 0)
            return;

        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        if (settings is null || !settings.TeacherSharedFileDownloadedEnabled)
        {
            logger.LogInformation(
                "Skipped teacher download notify for file {FileId}: TeacherSharedFileDownloadedEnabled is off",
                fileId);
            return;
        }

        // First download only — any prior in-app notification for this file means SMS/email already went out.
        if (await notificationRepository.ExistsForRelatedEntityAsync(
                DownloadNotificationType,
                fileId,
                cancellationToken))
        {
            logger.LogInformation(
                "Skipped teacher download notify for file {FileId}: already notified on first download",
                fileId);
            return;
        }

        // Only the teacher who uploaded this file (not every teacher linked to the student).
        if (uploadedByUserId is null or <= 0)
        {
            logger.LogWarning(
                "Skipped teacher download notify for file {FileId}: UploadedByUserId is missing",
                fileId);
            return;
        }

        var uploaderUserId = uploadedByUserId.Value;

        var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(managedRoomStudentId);
        var fullName = !string.IsNullOrWhiteSpace(studentDisplayName)
            ? studentDisplayName.Trim()
            : student is null
                ? "دانشجو"
                : $"{student.FirstName} {student.LastName}".Trim();
        if (string.IsNullOrWhiteSpace(fullName))
            fullName = "دانشجو";

        var title = string.IsNullOrWhiteSpace(fileTitle) ? "فایل جلسه" : fileTitle.Trim();
        var template = settings.TeacherSharedFileDownloadedMessageTemplate;
        if (string.IsNullOrWhiteSpace(template))
            template = DefaultDownloadMessageTemplate;

        var body = SmsMessageTemplateDefaults.ApplyFullNameTitle(template, fullName, title);

        await notificationRepository.InsertAsync(UserNotification.Create(
            uploaderUserId,
            "دانلود فایل توسط دانشجو",
            body,
            DownloadNotificationType,
            "/professor/online-rooms",
            fileId));

        // Persist first so a second download cannot pass the ExistsForRelatedEntity gate and re-send SMS/email.
        await notificationRepository.CommitAsync();

        await smsNotificationService.TrySendTeacherSharedFileDownloadedAsync(
            uploaderUserId,
            fullName,
            title,
            cancellationToken);

        await TrySendTeacherDownloadEmailAsync(uploaderUserId, fullName, title, cancellationToken);
        await engagementRealtime.NotifyUserNotificationAsync(uploaderUserId);

        logger.LogInformation(
            "Shared-file download notification sent to uploader {UploaderUserId} for managed student {ManagedStudentId}, file {FileId}",
            uploaderUserId,
            managedRoomStudentId,
            fileId);
    }

    private async Task TrySendTeacherDownloadEmailAsync(
        long teacherUserId,
        string studentFullName,
        string fileTitle,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = teacherUserId });
            if (user is null || string.IsNullOrWhiteSpace(user.Email))
                return;

            var recipientName = !string.IsNullOrWhiteSpace(user.FullName)
                ? user.FullName.Trim()
                : $"{user.FirstName} {user.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(recipientName))
                recipientName = user.UserName ?? "مدرس";

            await transactionalEmailNotifier.SendTeacherSharedFileDownloadedAsync(
                user.Email.Trim(),
                recipientName,
                studentFullName,
                fileTitle,
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Failed to send teacher shared-file download email to user {TeacherUserId}",
                teacherUserId);
        }
    }
}
