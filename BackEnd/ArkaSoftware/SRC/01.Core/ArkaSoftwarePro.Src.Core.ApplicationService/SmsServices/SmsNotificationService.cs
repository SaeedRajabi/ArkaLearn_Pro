using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;

using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;

using ArkaSoftwarePro.Src.Core.Contracts.Sms;

using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;

using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById;

using ArkaSoftwarePro.Src.Core.RequestResponse.Users;

using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;

using Microsoft.Extensions.Configuration;

using Microsoft.Extensions.Logging;

using NotificationSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices;



public sealed class SmsNotificationService(

    INotificationSettingsProvider settingsProvider,

    IEducationPlanQueryRepository educationPlanQueryRepository,

    IManagedRoomStudentCommandRepository managedRoomStudentRepository,

    IUserQueryRepository userQueryRepository,

    ISmsIrClient smsIrClient,

    IConfiguration configuration,

    ILogger<SmsNotificationService> logger) : ISmsNotificationService

{

    private const int MaxFullNameLength = 100;

    private const int MaxTitleLength = 80;

    private const int MaxTeacherNameLength = 80;



    public Task TrySendEducationPlanAssignedAsync(long educationPlanId, CancellationToken cancellationToken = default)

    {

        return SendEducationPlanSmsAsync(

            educationPlanId,

            assigned: true,

            managedRoomStudentId: null,

            planTitle: null,

            ownerUserId: null,

            cancellationToken);

    }



    public Task TrySendEducationPlanRemovedAsync(

        long managedRoomStudentId,

        string planTitle,

        long ownerUserId,

        CancellationToken cancellationToken = default)

    {

        return SendEducationPlanSmsAsync(

            educationPlanId: null,

            assigned: false,

            managedRoomStudentId,

            planTitle,

            ownerUserId,

            cancellationToken);

    }



    private async Task SendEducationPlanSmsAsync(

        long? educationPlanId,

        bool assigned,

        long? managedRoomStudentId,

        string? planTitle,

        long? ownerUserId,

        CancellationToken cancellationToken)

    {

        try

        {

            var settings = await settingsProvider.GetCurrentAsync(cancellationToken);

            if (settings is null || !settings.CanSendSms || !settings.EducationPlanSmsEnabled)

                return;



            var verifyTemplateId = assigned

                ? settings.EducationPlanVerifyTemplateId

                : settings.EducationPlanRemovedVerifyTemplateId;

            var messageTemplate = assigned

                ? settings.EducationPlanMessageTemplate

                : settings.EducationPlanRemovedMessageTemplate;



            if (verifyTemplateId <= 0 && string.IsNullOrWhiteSpace(messageTemplate))

                return;



            GetEducationPlanByIdQri? plan = null;

            if (educationPlanId is > 0)

            {

                plan = await educationPlanQueryRepository.GetEducationPlanByIdExecuteAsync(

                    new GetEducationPlanByIdQuery { PlanId = educationPlanId.Value });

                if (plan is null)

                    return;

            }



            var studentId = plan?.ManagedRoomStudentId ?? managedRoomStudentId ?? 0;

            if (studentId <= 0)

                return;



            var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(studentId);

            var phone = await ResolvePhoneAsync(student, cancellationToken);

            if (string.IsNullOrWhiteSpace(phone))

                return;



            var fullName = ResolveStudentFullName(plan, student);

            var title = Truncate(

                plan?.Title?.Trim() ?? planTitle?.Trim() ?? "Education Plan",

                MaxTitleLength);

            var teacherName = await ResolveTeacherNameAsync(

                plan?.OwnerUserId ?? ownerUserId ?? 0,

                plan?.OwnerFullName,

                cancellationToken);



            if (verifyTemplateId > 0)

            {

                await smsIrClient.SendVerifyAsync(

                    phone,

                    verifyTemplateId,

                    [

                        new SmsVerifyParameter { Name = "FULLNAME", Value = fullName },

                        new SmsVerifyParameter { Name = "TITLE", Value = title },

                        new SmsVerifyParameter { Name = "TEACHERNAME", Value = teacherName },

                    ],

                    cancellationToken);

                return;

            }



            if (string.IsNullOrWhiteSpace(messageTemplate))

                return;



            var message = BuildMessage(messageTemplate, fullName, title, teacherName, plan);

            await smsIrClient.SendBulkAsync(settings.LineNumber, message, [phone], cancellationToken: cancellationToken);

        }

        catch (Exception ex)

        {

            var planRef = educationPlanId?.ToString() ?? managedRoomStudentId?.ToString() ?? "unknown";

            logger.LogWarning(ex, "Failed to send education plan {Mode} SMS for {PlanRef}", assigned ? "assign" : "remove", planRef);

        }

    }



    private async Task<string?> ResolvePhoneAsync(ManagedRoomStudent? student, CancellationToken cancellationToken)

    {

        var phone = student?.Phone;

        if (string.IsNullOrWhiteSpace(phone) && student is not null)

        {

            var contact = await userQueryRepository.GetUserLookupByIdentityAsync(

                student.UserName.Value,

                student.Email,

                cancellationToken);

            phone = contact?.PhoneNumber;

        }



        if (string.IsNullOrWhiteSpace(phone) || !IranianPhoneNormalizer.TryNormalizeLocalNumber(phone, out _))

            return null;



        return phone;

    }



    private static string ResolveStudentFullName(GetEducationPlanByIdQri? plan, ManagedRoomStudent? student)

    {

        var fullNameRaw = plan?.StudentFullName?.Trim();

        if (string.IsNullOrWhiteSpace(fullNameRaw) && student is not null)

            fullNameRaw = $"{student.FirstName} {student.LastName}".Trim();

        if (string.IsNullOrWhiteSpace(fullNameRaw))

            fullNameRaw = "Student";

        return Truncate(fullNameRaw, MaxFullNameLength);

    }



    private async Task<string> ResolveTeacherNameAsync(

        long ownerUserId,

        string? ownerFullName,

        CancellationToken cancellationToken)

    {

        var name = ownerFullName?.Trim();

        if (string.IsNullOrWhiteSpace(name) && ownerUserId > 0)

        {

            var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = ownerUserId });

            name = user?.FullName?.Trim();

        }



        return Truncate(string.IsNullOrWhiteSpace(name) ? "Instructor" : name, MaxTeacherNameLength);

    }



    private string BuildMessage(

        string template,

        string fullName,

        string title,

        string teacherName,

        GetEducationPlanByIdQri? plan)

    {

        var clientBase = configuration["PaymentGateway:ClientBaseUrl"]?.Trim().TrimEnd('/') ?? "https://arkasoftware.ir";

        var roomLink = string.IsNullOrWhiteSpace(plan?.RoomSlug)

            ? $"{clientBase}/account?view=education-plans"

            : $"{clientBase}/room/{plan.RoomSlug}";



        var message = template

            .Replace("{StudentName}", fullName, StringComparison.OrdinalIgnoreCase)

            .Replace("{PlanTitle}", title, StringComparison.OrdinalIgnoreCase)

            .Replace("{TeacherName}", teacherName, StringComparison.OrdinalIgnoreCase)

            .Replace("#FULLNAME#", fullName, StringComparison.OrdinalIgnoreCase)

            .Replace("#TITLE#", title, StringComparison.OrdinalIgnoreCase)

            .Replace("#TEACHERNAME#", teacherName, StringComparison.OrdinalIgnoreCase);



        if (plan is null)

            return message;



        var installmentsText = string.Empty;
        if (plan.Installments is { Count: > 0 })
        {
            installmentsText = string.Join(
                " | ",
                plan.Installments
                    .OrderBy(i => i.InstallmentNumber)
                    .Select(i =>
                        $"قسط{i.InstallmentNumber}:{i.AmountToman:0}تومان@{i.DueDateUtc:yyyy/MM/dd}"));
        }

        return message

            .Replace("{StartDate}", plan.StartDateUtc.ToString("yyyy/MM/dd"), StringComparison.OrdinalIgnoreCase)

            .Replace("{EndDate}", plan.EndDateUtc.ToString("yyyy/MM/dd"), StringComparison.OrdinalIgnoreCase)

            .Replace("{TotalHours}", plan.TotalHours.ToString(), StringComparison.OrdinalIgnoreCase)

            .Replace("{HourlyRate}", plan.HourlyRate.ToString(), StringComparison.OrdinalIgnoreCase)

            .Replace("{TotalCost}", plan.TotalCost.ToString("0"), StringComparison.OrdinalIgnoreCase)

            .Replace("{RoomTitle}", plan.RoomTitle ?? "", StringComparison.OrdinalIgnoreCase)

            .Replace("{RoomLink}", roomLink, StringComparison.OrdinalIgnoreCase)

            .Replace("#INSTALLMENTS#", installmentsText, StringComparison.OrdinalIgnoreCase)

            .Replace("{Installments}", installmentsText, StringComparison.OrdinalIgnoreCase);

    }



    private static string Truncate(string value, int maxLength) =>

        value.Length <= maxLength ? value : value[..maxLength].Trim();



    public Task TrySendSupportUnreadReminderAsync(
        long recipientUserId,
        string senderName,
        string subject,
        long conversationId,
        bool recipientIsTeacher,
        CancellationToken cancellationToken = default)
        => SendSupportChatSmsAsync(recipientUserId, senderName, subject, recipientIsTeacher, cancellationToken);

    public Task TrySendEducationPlanInstallmentDueAsync(
        long installmentId,
        int offsetDays = 0,
        CancellationToken cancellationToken = default)
        => SendEducationPlanInstallmentDueSmsAsync(installmentId, offsetDays, cancellationToken);

    public Task TrySendCourseInstallmentDueAsync(
        long installmentId,
        int daysRemaining,
        string paymentLink,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask; // resolved via TrySendCourseInstallmentDueMessageAsync from reminder scheduler

    public Task TrySendCourseInstallmentDueMessageAsync(
        string phoneNumber,
        string fullName,
        string courseTitle,
        int daysRemaining,
        string paymentLink,
        CancellationToken cancellationToken = default)
        => SendCourseInstallmentDueSmsAsync(phoneNumber, fullName, courseTitle, daysRemaining, paymentLink, cancellationToken);

    public Task TrySendStudentSharedFileAsync(
        long managedRoomStudentId,
        string fileTitle,
        CancellationToken cancellationToken = default)
        => SendStudentSharedFileSmsAsync(managedRoomStudentId, fileTitle, cancellationToken);

    public Task TrySendTeacherSharedFileDownloadedAsync(
        long teacherUserId,
        string studentFullName,
        string fileTitle,
        CancellationToken cancellationToken = default)
        => SendTeacherSharedFileDownloadedSmsAsync(teacherUserId, studentFullName, fileTitle, cancellationToken);

    public Task<bool> TrySendCalendarEventReminderAsync(
        long recipientUserId,
        string title,
        DateTime startUtc,
        bool isAllDay,
        int minutesBefore,
        CancellationToken cancellationToken = default)
        => SendCalendarEventReminderSmsAsync(recipientUserId, title, startUtc, isAllDay, minutesBefore, cancellationToken);

    private async Task SendStudentSharedFileSmsAsync(
        long managedRoomStudentId,
        string fileTitle,
        CancellationToken cancellationToken)
    {
        try
        {
            var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
            if (settings is null || !settings.CanSendSms || !settings.StudentSharedFileSmsEnabled)
                return;

            var verifyTemplateId = settings.StudentSharedFileVerifyTemplateId;
            var messageTemplate = string.IsNullOrWhiteSpace(settings.StudentSharedFileMessageTemplate)
                ? SmsMessageTemplateDefaults.StudentSharedFileMessage
                : settings.StudentSharedFileMessageTemplate;

            if (verifyTemplateId <= 0 && string.IsNullOrWhiteSpace(messageTemplate))
                return;

            var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(managedRoomStudentId);
            var phone = await ResolvePhoneAsync(student, cancellationToken);
            if (string.IsNullOrWhiteSpace(phone))
                return;

            var title = Truncate(string.IsNullOrWhiteSpace(fileTitle) ? "فایل جلسه" : fileTitle.Trim(), MaxTitleLength);

            if (verifyTemplateId > 0)
            {
                await smsIrClient.SendVerifyAsync(
                    phone,
                    verifyTemplateId,
                    [new SmsVerifyParameter { Name = "TITLE", Value = title }],
                    cancellationToken);
                return;
            }

            var message = SmsMessageTemplateDefaults.ApplyTitle(messageTemplate, title);
            await smsIrClient.SendBulkAsync(settings.LineNumber, message, [phone], cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send student shared file SMS for student {StudentId}", managedRoomStudentId);
        }
    }

    private async Task SendTeacherSharedFileDownloadedSmsAsync(
        long teacherUserId,
        string studentFullName,
        string fileTitle,
        CancellationToken cancellationToken)
    {
        try
        {
            var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
            if (settings is null || !settings.CanSendSms || !settings.TeacherSharedFileDownloadedEnabled)
                return;

            var verifyTemplateId = settings.TeacherSharedFileDownloadedVerifyTemplateId;
            var messageTemplate = string.IsNullOrWhiteSpace(settings.TeacherSharedFileDownloadedMessageTemplate)
                ? SmsMessageTemplateDefaults.TeacherSharedFileDownloadedMessage
                : settings.TeacherSharedFileDownloadedMessageTemplate;

            if (verifyTemplateId <= 0 && string.IsNullOrWhiteSpace(messageTemplate))
                return;

            var user = await userQueryRepository.ExecuteAsync(
                new GetUserByIdQuery { UserId = teacherUserId });

            var phone = user?.PhoneNumber;
            if (string.IsNullOrWhiteSpace(phone) || !IranianPhoneNormalizer.TryNormalizeLocalNumber(phone, out _))
                return;

            var fullName = Truncate(
                string.IsNullOrWhiteSpace(studentFullName) ? "دانشجو" : studentFullName.Trim(),
                MaxFullNameLength);
            var title = Truncate(string.IsNullOrWhiteSpace(fileTitle) ? "فایل جلسه" : fileTitle.Trim(), MaxTitleLength);

            if (verifyTemplateId > 0)
            {
                await smsIrClient.SendVerifyAsync(
                    phone,
                    verifyTemplateId,
                    [
                        new SmsVerifyParameter { Name = "FULLNAME", Value = fullName },
                        new SmsVerifyParameter { Name = "TITLE", Value = title },
                    ],
                    cancellationToken);
                return;
            }

            var message = SmsMessageTemplateDefaults.ApplyFullNameTitle(messageTemplate, fullName, title);
            await smsIrClient.SendBulkAsync(settings.LineNumber, message, [phone], cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Failed to send teacher shared-file download SMS to user {TeacherUserId}",
                teacherUserId);
        }
    }

    private async Task SendEducationPlanInstallmentDueSmsAsync(
        long installmentId,
        int offsetDays,
        CancellationToken cancellationToken)
    {
        try
        {
            var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
            if (settings is null || !settings.CanSendSms || !settings.EducationPlanSmsEnabled)
                return;

            var installment = await educationPlanQueryRepository.GetInstallmentByIdAsync(installmentId, cancellationToken);
            if (installment is null || installment.IsPaid)
                return;

            var plan = await educationPlanQueryRepository.GetEducationPlanByIdExecuteAsync(
                new GetEducationPlanByIdQuery { PlanId = installment.EducationPlanId });
            if (plan is null)
                return;

            var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(plan.ManagedRoomStudentId);
            var phone = await ResolvePhoneAsync(student, cancellationToken);
            if (string.IsNullOrWhiteSpace(phone))
                return;

            var fullName = ResolveStudentFullName(plan, student);
            var title = Truncate(plan.Title?.Trim() ?? "Education Plan", MaxTitleLength);
            var installmentNumber = installment.InstallmentNumber.ToString();
            var amount = installment.AmountToman.ToString("0");
            var dueDate = installment.DueDateUtc.ToString("yyyy/MM/dd");
            var daysText = offsetDays switch
            {
                < 0 => $"تا {-offsetDays} روز دیگر",
                > 0 => $"{offsetDays} روز از سررسید گذشته",
                _ => "امروز",
            };
            var verifyTemplateId = settings.EducationPlanInstallmentDueVerifyTemplateId;
            var messageTemplate = string.IsNullOrWhiteSpace(settings.EducationPlanInstallmentDueMessageTemplate)
                ? SmsMessageTemplateDefaults.EducationPlanInstallmentDueMessage
                : settings.EducationPlanInstallmentDueMessageTemplate;

            if (verifyTemplateId <= 0 && string.IsNullOrWhiteSpace(messageTemplate))
                return;

            if (verifyTemplateId > 0)
            {
                await smsIrClient.SendVerifyAsync(
                    phone,
                    verifyTemplateId,
                    [
                        new SmsVerifyParameter { Name = "FULLNAME", Value = fullName },
                        new SmsVerifyParameter { Name = "TITLE", Value = title },
                        new SmsVerifyParameter { Name = "INSTALLMENT", Value = installmentNumber },
                        new SmsVerifyParameter { Name = "AMOUNT", Value = amount },
                        new SmsVerifyParameter { Name = "DUEDATE", Value = dueDate },
                        new SmsVerifyParameter { Name = "DAYS", Value = Math.Abs(offsetDays).ToString() },
                    ],
                    cancellationToken);
                return;
            }

            var message = messageTemplate
                .Replace("#FULLNAME#", fullName, StringComparison.OrdinalIgnoreCase)
                .Replace("{StudentName}", fullName, StringComparison.OrdinalIgnoreCase)
                .Replace("#TITLE#", title, StringComparison.OrdinalIgnoreCase)
                .Replace("{PlanTitle}", title, StringComparison.OrdinalIgnoreCase)
                .Replace("#INSTALLMENT#", installmentNumber, StringComparison.OrdinalIgnoreCase)
                .Replace("{InstallmentNumber}", installmentNumber, StringComparison.OrdinalIgnoreCase)
                .Replace("#AMOUNT#", amount, StringComparison.OrdinalIgnoreCase)
                .Replace("{Amount}", amount, StringComparison.OrdinalIgnoreCase)
                .Replace("#DUEDATE#", dueDate, StringComparison.OrdinalIgnoreCase)
                .Replace("{DueDate}", dueDate, StringComparison.OrdinalIgnoreCase)
                .Replace("#DAYSTEXT#", daysText, StringComparison.OrdinalIgnoreCase)
                .Replace("{DaysText}", daysText, StringComparison.OrdinalIgnoreCase)
                .Replace("#DAYS#", Math.Abs(offsetDays).ToString(), StringComparison.OrdinalIgnoreCase)
                .Replace("{Days}", Math.Abs(offsetDays).ToString(), StringComparison.OrdinalIgnoreCase);

            await smsIrClient.SendBulkAsync(settings.LineNumber, message, [phone], cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send education plan installment due SMS for installment {InstallmentId}", installmentId);
        }
    }

    private async Task SendCourseInstallmentDueSmsAsync(
        string phoneNumber,
        string fullName,
        string courseTitle,
        int daysRemaining,
        string paymentLink,
        CancellationToken cancellationToken)
    {
        try
        {
            var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
            if (settings is null || !settings.CanSendSms)
                return;

            if (string.IsNullOrWhiteSpace(phoneNumber)
                || !IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var normalizedPhone))
                return;

            var verifyTemplateId = settings.EducationPlanInstallmentDueVerifyTemplateId;
            var messageTemplate = string.IsNullOrWhiteSpace(settings.EducationPlanInstallmentDueMessageTemplate)
                ? "دانشجوی گرامی {FULLNAME}، تا پرداخت قسط دوره {TITLE} {DAYS} روز مهلت دارید. پرداخت: {LINK}"
                : settings.EducationPlanInstallmentDueMessageTemplate;

            var name = Truncate(fullName, MaxFullNameLength);
            var title = Truncate(courseTitle, MaxTitleLength);
            var days = daysRemaining.ToString();

            if (verifyTemplateId > 0)
            {
                await smsIrClient.SendVerifyAsync(
                    normalizedPhone,
                    verifyTemplateId,
                    [
                        new SmsVerifyParameter { Name = "FULLNAME", Value = name },
                        new SmsVerifyParameter { Name = "TITLE", Value = title },
                        new SmsVerifyParameter { Name = "DAYS", Value = days },
                    ],
                    cancellationToken);
                return;
            }

            var message = messageTemplate
                .Replace("{FULLNAME}", name, StringComparison.OrdinalIgnoreCase)
                .Replace("{TITLE}", title, StringComparison.OrdinalIgnoreCase)
                .Replace("{DAYS}", days, StringComparison.OrdinalIgnoreCase)
                .Replace("{LINK}", paymentLink ?? "", StringComparison.OrdinalIgnoreCase)
                .Replace("#FULLNAME#", name, StringComparison.OrdinalIgnoreCase)
                .Replace("#TITLE#", title, StringComparison.OrdinalIgnoreCase);

            await smsIrClient.SendBulkAsync(settings.LineNumber, message, [normalizedPhone], cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send course installment due SMS");
        }
    }

    private async Task SendSupportChatSmsAsync(
        long recipientUserId,
        string senderName,
        string subject,
        bool recipientIsTeacher,
        CancellationToken cancellationToken)
    {
        try
        {
            var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
            if (settings is null || !settings.CanSendSms || !settings.SupportChatSmsEnabled)
                return;

            var verifyTemplateId = recipientIsTeacher
                ? settings.SupportChatVerifyTemplateId
                : settings.SupportChatStudentUnreadVerifyTemplateId;

            var configuredTemplate = recipientIsTeacher
                ? settings.SupportChatMessageTemplate
                : settings.SupportChatStudentUnreadMessageTemplate;

            var defaultTemplate = recipientIsTeacher
                ? SmsMessageTemplateDefaults.SupportChatTeacherUnreadMessage
                : SmsMessageTemplateDefaults.SupportChatStudentUnreadMessage;

            var messageTemplate = string.IsNullOrWhiteSpace(configuredTemplate)
                ? defaultTemplate
                : configuredTemplate;

            if (verifyTemplateId <= 0 && string.IsNullOrWhiteSpace(messageTemplate))
                return;

            var user = await userQueryRepository.ExecuteAsync(
                new GetUserByIdQuery { UserId = recipientUserId });

            var phone = user?.PhoneNumber;
            if (string.IsNullOrWhiteSpace(phone) || !IranianPhoneNormalizer.TryNormalizeLocalNumber(phone, out _))
                return;

            var truncatedSender = Truncate(senderName, MaxFullNameLength);
            var truncatedSubject = Truncate(subject, MaxTitleLength);

            if (verifyTemplateId > 0)
            {
                await smsIrClient.SendVerifyAsync(
                    phone,
                    verifyTemplateId,
                    [
                        new SmsVerifyParameter { Name = "FULLNAME", Value = truncatedSender },
                        new SmsVerifyParameter { Name = "TITLE", Value = truncatedSubject },
                        new SmsVerifyParameter { Name = "STUDENTNAME", Value = truncatedSender },
                    ],
                    cancellationToken);
                return;
            }

            var message = SmsMessageTemplateDefaults.ApplyFullNameTitle(
                messageTemplate,
                truncatedSender,
                truncatedSubject);

            await smsIrClient.SendBulkAsync(settings.LineNumber, message, [phone], cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send support chat SMS to user {RecipientUserId}", recipientUserId);
        }
    }

    private async Task<bool> SendCalendarEventReminderSmsAsync(
        long recipientUserId,
        string title,
        DateTime startUtc,
        bool isAllDay,
        int minutesBefore,
        CancellationToken cancellationToken)
    {
        try
        {
            var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
            if (settings is null || !settings.CanSendSms || !settings.CalendarEventSmsEnabled)
            {
                logger.LogDebug(
                    "Calendar event SMS skipped for user {RecipientUserId}: SMS disabled or not configured",
                    recipientUserId);
                return false;
            }

            var verifyTemplateId = settings.CalendarEventVerifyTemplateId;
            var messageTemplate = string.IsNullOrWhiteSpace(settings.CalendarEventMessageTemplate)
                ? SmsMessageTemplateDefaults.CalendarEventReminderMessage
                : settings.CalendarEventMessageTemplate;

            if (verifyTemplateId <= 0 && string.IsNullOrWhiteSpace(messageTemplate))
            {
                logger.LogWarning(
                    "Calendar event SMS skipped for user {RecipientUserId}: no verify template or message template",
                    recipientUserId);
                return false;
            }

            var phone = await userQueryRepository.GetSmsMobileByUserIdAsync(recipientUserId, cancellationToken);
            if (string.IsNullOrWhiteSpace(phone))
            {
                logger.LogWarning(
                    "Calendar event SMS skipped for user {RecipientUserId}: no valid Iranian mobile on account",
                    recipientUserId);
                return false;
            }

            var schedule = FormatCalendarSchedule(startUtc, isAllDay);
            var minutesLabel = minutesBefore > 0 ? minutesBefore.ToString() : "0";

            if (verifyTemplateId > 0)
            {
                var verifyTitle = Truncate(title.Trim(), SmsVerifyParameter.MaxValueLength);
                var verifyDate = Truncate(schedule.Date, SmsVerifyParameter.MaxValueLength);
                var verifyTime = Truncate(schedule.Time, SmsVerifyParameter.MaxValueLength);
                await smsIrClient.SendVerifyAsync(
                    phone,
                    verifyTemplateId,
                    [
                        new SmsVerifyParameter { Name = "TITLE", Value = verifyTitle },
                        new SmsVerifyParameter { Name = "DATE", Value = verifyDate },
                        new SmsVerifyParameter { Name = "TIME", Value = verifyTime },
                        new SmsVerifyParameter { Name = "MINUTES", Value = minutesLabel },
                    ],
                    cancellationToken);
                return true;
            }

            var bulkTitle = Truncate(title.Trim(), MaxTitleLength);
            var message = SmsMessageTemplateDefaults.ApplyTitleDateTime(
                messageTemplate,
                bulkTitle,
                schedule.Date,
                schedule.Time);
            await smsIrClient.SendBulkAsync(settings.LineNumber, message, [phone], cancellationToken: cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send calendar event SMS to user {RecipientUserId}", recipientUserId);
            return false;
        }
    }

    private static (string Date, string Time) FormatCalendarSchedule(DateTime startUtc, bool isAllDay)
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(
            startUtc,
            TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "Iran Standard Time" : "Asia/Tehran"));
        var culture = System.Globalization.CultureInfo.GetCultureInfo("fa-IR");
        var date = local.ToString("yyyy/MM/dd", culture);
        var time = isAllDay ? "تمام روز" : local.ToString("HH:mm", culture);
        return (date, time);
    }

}

