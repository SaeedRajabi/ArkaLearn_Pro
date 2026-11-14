namespace ArkaSoftwarePro.Src.Core.Contracts.Sms;



public interface ISmsNotificationService

{

    Task TrySendEducationPlanAssignedAsync(long educationPlanId, CancellationToken cancellationToken = default);



    Task TrySendEducationPlanRemovedAsync(

        long managedRoomStudentId,

        string planTitle,

        long ownerUserId,

        CancellationToken cancellationToken = default);



    Task TrySendSupportUnreadReminderAsync(
        long recipientUserId,
        string senderName,
        string subject,
        long conversationId,
        bool recipientIsTeacher,
        CancellationToken cancellationToken = default);

    Task TrySendEducationPlanInstallmentDueAsync(
        long installmentId,
        int offsetDays = 0,
        CancellationToken cancellationToken = default);

    Task TrySendCourseInstallmentDueAsync(
        long installmentId,
        int daysRemaining,
        string paymentLink,
        CancellationToken cancellationToken = default);

    /// <summary>ارسال مستقیم یادآوری قسط دوره با شماره و متن‌های از قبل آماده‌شده.</summary>
    Task TrySendCourseInstallmentDueMessageAsync(
        string phoneNumber,
        string fullName,
        string courseTitle,
        int daysRemaining,
        string paymentLink,
        CancellationToken cancellationToken = default);

    Task TrySendStudentSharedFileAsync(
        long managedRoomStudentId,
        string fileTitle,
        CancellationToken cancellationToken = default);

    Task TrySendTeacherSharedFileDownloadedAsync(
        long teacherUserId,
        string studentFullName,
        string fileTitle,
        CancellationToken cancellationToken = default);

    /// <returns>true when SMS was sent; false when skipped or failed.</returns>
    Task<bool> TrySendCalendarEventReminderAsync(
        long recipientUserId,
        string title,
        DateTime startUtc,
        bool isAllDay,
        int minutesBefore,
        CancellationToken cancellationToken = default);
}

