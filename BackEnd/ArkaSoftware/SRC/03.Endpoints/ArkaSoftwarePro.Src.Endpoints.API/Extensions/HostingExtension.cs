using ArkaSoftware.Extensions.Caching.Distributed.InMemory.Extensions.DI;
using ArkaSoftware.Extensions.Caching.Distributed.Redis.Extensions.DependencyInjection;
using ArkaSoftware.Extensions.Serializers.Microsoft.Extensions.DI;
using ArkaSoftware.Extensions.Translations.Parrot.Extensions.DI;
using ArkaSoftware.Extensions.UsersManagement.Extensions.DI;
using ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.EngagementServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices;
using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Messages.IHubs;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.GoogleAuth;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;
using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using ArkaSoftwarePro.Src.Endpoints.API.CustomDecorators;
using ArkaSoftwarePro.Src.Endpoints.API.DI.JWT;
using ArkaSoftwarePro.Src.Endpoints.API.DI.Swaggers.Extensions;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using ArkaSoftwarePro.Src.Endpoints.API.Middleware;
using ArkaSoftwarePro.Src.Endpoints.API.RealTimes;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.ManagedRoomStudents;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Services;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Users;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Sms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Teachers;
using ArkaSoftwarePro.Src.Infrastructure.Security.IMP.GoogleAuth;
using ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Services;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.ApplicationService.Events;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Endpoints.Web.Extensions.DI;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Interceptors;
using Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;
using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Globalization;
using System.Text;
using ICookieManager = ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts.ICookieManager;

namespace ArkaSoftwarePro.Src.Endpoints.API.Extensions
{
    /// <summary>
    /// 
    /// </summary>
    public static class HostingExtension
    {

        /// <summary>
        /// 
        /// </summary>
        /// <param name="builder"></param>
        /// <returns></returns>
        public static WebApplication ConfigureService(this WebApplicationBuilder builder)
        {
            IConfiguration configuration = builder.Configuration;
            const long maxUploadBytes = 3L * 1024 * 1024 * 1024; // 3 GB
            builder.Services.AddSingleton<IBootstrapConnectionStringProvider, ArkaSoftwarePro.Src.Infrastructure.Integrations.DatabaseConnection.BootstrapConnectionStringProvider>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Infrastructure.Integrations.DatabaseConnection.DatabaseConnectionSettingsLoader>();
            builder.Services.AddSingleton<IDatabaseConnectionSettingsCache, ArkaSoftwarePro.Src.Infrastructure.Integrations.DatabaseConnection.DatabaseConnectionSettingsCache>();
            builder.Services.AddSingleton<IDatabaseConnectionStringProvider, ArkaSoftwarePro.Src.Infrastructure.Integrations.DatabaseConnection.DatabaseConnectionStringProvider>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.DatabaseConnection.DatabaseConnectionCacheWarmupService>();
            builder.Services.AddControllers(options =>
                {
                    options.Conventions.Add(new FormFileApiExplorerConvention());
                    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
                })
                .AddJsonOptions(options =>
                {
                    // Preserve emits $id/$ref and breaks admin clients parsing user lists (delete got UserId=0 → 404).
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                    options.JsonSerializerOptions.Converters.Add(new Common.LongAsStringJsonConverter());
                    options.JsonSerializerOptions.Converters.Add(new Common.NullableLongAsStringJsonConverter());
                });
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddScoped<ICurrentActor, ArkaSoftwarePro.Src.Endpoints.API.Adapters.Authentication.HttpCurrentActor>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices.PaymentApplicationService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments.IClientPaymentGatewayFactory>(sp =>
                sp.GetRequiredService<ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments.ClientPaymentGatewayFactory>());
            builder.Services.Configure<FormOptions>(options =>
            {
                options.MultipartBodyLengthLimit = maxUploadBytes;
                options.ValueLengthLimit = int.MaxValue;
                options.MultipartHeadersLengthLimit = int.MaxValue;
            });
            builder.Services.Configure<IISServerOptions>(options =>
            {
                options.MaxRequestBodySize = maxUploadBytes;
            });
            builder.WebHost.ConfigureKestrel(options =>
            {
                options.Limits.MaxRequestBodySize = maxUploadBytes;
                options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(30);
                options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
            });
            builder.Services.AddArkaSoftwareApiCore(configuration, "ArkaSoftwarePro");
            builder.Services.AddArkaSoftwareDependencies(configuration, "ArkaSoftwarePro");
            builder.Services.AddApplicationMapping(configuration);
            builder.Services.AddArkaSoftwareWebUserInfoService(options => options.DefaultUserId = "1", useFake: false);
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddArkaSoftwareInMemoryCaching();
            builder.Services.AddMemoryCache();
            builder.Services.AddArkaSoftwareRedisDistributedCache(configuration, "DistributedRedisCacheOptions");
            builder.Services.AddDbContext<ArkaSoftwareCommandDbContext>((serviceProvider, options) =>
            {
                var connectionString = serviceProvider.GetRequiredService<IDatabaseConnectionStringProvider>().GetConnectionString();
                options.UseSqlServer(connectionString, sql =>
                    {
                        sql.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(10),
                            errorNumbersToAdd: null);
                    })
                    .AddInterceptors(new SetPersianYeKeInterceptor(), new AddAuditDataInterceptor());
                // Keep EF model-change validation enabled; migrations are deployed explicitly.
            });
            // Applies pending EF migrations (e.g. new TURN/STUN columns) at startup.
            //builder.Services.AddArkaSoftwareCommandDatabaseMigrateOnStartup();

            builder.Services.AddDbContext<ArkaSoftwareQueryDbContext>((serviceProvider, options) =>
            {
                var connectionString = serviceProvider.GetRequiredService<IDatabaseConnectionStringProvider>().GetConnectionString();
                options.UseSqlServer(connectionString, sql =>
                {
                    sql.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorNumbersToAdd: null);
                    // Detail queries include several collections (course/teacher profiles).
                    // Split queries avoid the cartesian-explosion single join (observed
                    // 6-24s queries) and silence the MultipleCollectionIncludeWarning.
                    sql.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                });
            });
            builder.Services.AddArkaSoftwareMicrosoftSerializer();
            builder.Services.AddArkaSoftwareParrotTranslator(configuration, "ParrotTranslator");



            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands.ISoftwareCommandRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.SoftwareCommandRepository>();

            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands.IPromotionalVideoRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.PromotionalVideoRepository>();

            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands.ITeacherFinanceCommandRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.TeacherFinanceCommandRepository>();
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Queries.ITeacherFinanceQueryRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.TeacherFinanceQueryRepository>();

            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands.ISupportChatCommandRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.SupportChatCommandRepository>();
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription.IStudentSupportSubscriptionRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.StudentSupportSubscriptionRepository>();
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices.IStudentSupportAccessService,
                ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices.StudentSupportAccessService>();
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries.ISupportChatQueryRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.SupportChatQueryRepository>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.SupportChat.ISupportChatSmsScheduler,
                ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.SupportChatSmsScheduler>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.SupportChat.SupportChatSmsBackgroundService>();
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.IEducationPlanInstallmentReminderScheduler,
                ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.EducationPlanInstallmentReminderScheduler>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.EducationPlans.EducationPlanInstallmentReminderBackgroundService>();
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Courses.ICourseInstallmentReminderScheduler,
                ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.CourseInstallmentReminderScheduler>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.Courses.CourseInstallmentReminderBackgroundService>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.FileStorage.FileStorageMigrationBackgroundService>();

            builder.Services.AddScoped<TeacherAdvertisingEntitlements>();
            builder.Services.Configure<AdvertisementModerationOptions>(configuration.GetSection(AdvertisementModerationOptions.SectionName));
            builder.Services.AddHttpClient(nameof(TeacherAdvertisementContentModerator), client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
            });
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Teachers.ITeacherAdvertisementContentModerator,
                TeacherAdvertisementContentModerator>();
            builder.Services.AddScoped<TeacherXpService>();
            builder.Services.AddScoped<TeacherFinanceService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices.UserWalletService>();
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts.IUserWalletRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.UserWalletRepository>();
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Finance.IZibalWalletProvisioningService,
                ArkaSoftwarePro.Src.Infrastructure.Integrations.Finance.ZibalWalletProvisioningService>();
            builder.Services.AddScoped<AdvertisementBumpService>();
            builder.Services.AddScoped<ManualBumpCaptchaService>();
            builder.Services.AddScoped<EngagementNotifier>();
            builder.Services.AddScoped<CourseEnrollmentNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.CoursePurchaseFulfillmentService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands.CourseVideoStorageService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands.CourseLessonVideoUploadService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver>();
            builder.Services.AddScoped<TeacherProfileNotifier>();
            builder.Services.AddScoped<TeacherAdvertisementNotifier>();
            builder.Services.AddScoped<TeacherContentNotifier>();
            builder.Services.AddScoped<TeacherFollowNotifier>();
            builder.Services.AddScoped<ExamNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.QuestionBankServices.QuestionBankStatsService>();
            builder.Services.AddScoped<EducationPlanNotifier>();
            builder.Services.AddScoped<EducationPlanLifecycleNotifier>();
            builder.Services.AddScoped<CalendarEventNotifier>();
            builder.Services.AddScoped<CalendarEventReminderService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.ICalendarEventReminderScheduler,
                ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices.CalendarEventReminderScheduler>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.CalendarEvents.CalendarEventReminderBackgroundService>();
            builder.Services.AddScoped<UserFileNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.Common.ApplicationCommandExecutor>();
            builder.Services.AddScoped<UserFileApplicationService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.CourseMaterialDownloadService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.DesktopAppServices.DesktopInstallerDownloadService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.FileStorage.IDownloadReadRepository, ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories.DownloadReadRepository>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.RoomFileApplicationService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.RoomGuestAccessService>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Uploads.RoomFileUploadSessionStore>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.Uploads.UserFileUploadSessionStore>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.UserFiles.IUserFileReadRepository, ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories.UserFileReadRepository>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.FileStorage.ILegacyFileStore, ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.LegacyFileStore>();
            builder.Services.AddHostedService<CourseLifecycleBackgroundService>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.Outbox.OutboxDomainEventBackgroundService>();
            builder.Services.AddHostedService<AdvertisementAutoBumpBackgroundService>();
            builder.Services.Configure<ArkaSoftwarePro.Src.Infrastructure.Integrations.VideoWatermark.VideoWatermarkOptions>(
                configuration.GetSection(ArkaSoftwarePro.Src.Infrastructure.Integrations.VideoWatermark.VideoWatermarkOptions.SectionName));
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Infrastructure.Integrations.VideoWatermark.VideoWatermarkQueue>();
            builder.Services.AddSingleton<
                ArkaSoftwarePro.Src.Core.Contracts.Services.IVideoWatermarkQueue>(sp =>
                sp.GetRequiredService<ArkaSoftwarePro.Src.Infrastructure.Integrations.VideoWatermark.VideoWatermarkQueue>());
            builder.Services.AddScoped<
                ArkaSoftwarePro.Src.Core.Contracts.Services.IVideoWatermarkProcessor,
                ArkaSoftwarePro.Src.Infrastructure.Integrations.VideoWatermark.FfmpegVideoWatermarkProcessor>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.VideoWatermark.VideoWatermarkBackgroundService>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.Contracts.UserActivity.IUserActivityBuffer,
                ArkaSoftwarePro.Src.Infrastructure.Integrations.UserActivity.InMemoryUserActivityBuffer>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.UserActivity.UserActivityFlushBackgroundService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.UserActivity.IUserActivityRepository,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories.UserActivityRepository>();
            builder.Services.AddScoped<IManagedRoomStudentLinkedIdentityRemover, ManagedRoomStudentLinkedIdentityRemover>();
            builder.Services.AddScoped<IUserPortalAccountRemover, UserPortalAccountRemover>();
            builder.Services.AddScoped<IEntityTitleUniquenessChecker, EntityTitleUniquenessChecker>();
            builder.Services.AddScoped<IEntityPermanentDeletionService, EntityPermanentDeletionService>();
            builder.Services.AddScoped<IUserDeviceInfoService, UserDeviceInfoService>();
            builder.Services.AddScoped<ILoginGoogleAuth, LoginGoogleAuth>();
            builder.Services.AddScoped<ICookieManager, CookieManager>();
            builder.Services.AddScoped<ManagedRoomStudentAccessService>();
            builder.Services.AddScoped<IChatMessageHub, SignalRChatMessageSender>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.Rooms.IRoomAccessService, RoomAccessService>();
            builder.Services.AddSingleton(TimeProvider.System);
            builder.Services.AddSingleton<RoomMeetingCoordinator>();
            builder.Services.AddHostedService(sp => sp.GetRequiredService<RoomMeetingCoordinator>());
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.IProjectQaRealtimeNotifier, SignalRProjectQaNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.ICommunityQaRealtimeNotifier, SignalRCommunityQaNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.Engagement.IEngagementRealtimeNotifier, SignalREngagementNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.SupportChat.ISupportChatRealtimeNotifier, SignalRSupportChatNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.IRemoteAssistRealtimeNotifier, SignalRRemoteAssistNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.IPlatformSupportTicketRealtimeNotifier, SignalRPlatformSupportTicketNotifier>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.Contracts.SupportChat.ISupportChatPresence, ArkaSoftwarePro.Src.Infrastructure.Integrations.SupportChat.SupportChatPresence>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.Contracts.Rooms.IRoomSeatLivePresence, ArkaSoftwarePro.Src.Infrastructure.Integrations.Rooms.RoomSeatLivePresence>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.Contracts.Rooms.IRoomJoinTicketService, ArkaSoftwarePro.Src.Infrastructure.Integrations.Security.RoomJoinTicketService>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.Contracts.Rooms.IMeetingLifecycleService, ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms.MeetingLifecycleService>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.Contracts.Rooms.IRoomSeatAdminNotifier, ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms.RoomSeatAdminNotifier>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.IEducationPlanConsumptionService,
                ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.EducationPlanConsumptionService>();
            EmailServiceRegistration.ConfigureSmtpOptions(configuration, builder.Services);
            builder.Services.AddScoped<IEmailSettingsProvider, EmailSettingsProvider>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings.IGoogleAuthSettingsProvider,
                ArkaSoftwarePro.Src.Infrastructure.Integrations.GoogleAuth.GoogleAuthSettingsProvider>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers.UserEmailVerificationGuard>();
            EmailServiceRegistration.RegisterEmailService(builder.Services);
            builder.Services.AddScoped<IEmailTemplateCatalog, EmailTemplateCatalogService>();
            builder.Services.AddScoped<IEmailTemplateProvider, EmailTemplateProvider>();
            builder.Services.AddScoped<SmtpEmailService>();
            builder.Services.AddScoped<IEmailTransport>(sp => sp.GetRequiredService<SmtpEmailService>());
            builder.Services.AddScoped<TransactionalEmailSender>();
            builder.Services.AddScoped<ITransactionalEmailNotifier, TransactionalEmailNotifier>();
            builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
            builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();
            builder.Services.AddScoped<INewsletterSubscriptionService, NewsletterSubscriptionService>();
            builder.Services.AddScoped<INewsletterPublishNotifier, NewsletterPublishNotifier>();
            builder.Services.AddHttpClient(nameof(SmsIrSendingService))
                .ConfigureHttpClient(client => client.Timeout = TimeSpan.FromSeconds(25));
            builder.Services.AddScoped<INotificationSettingsProvider, NotificationSettingsProvider>();
            builder.Services.AddScoped<ISmsIrClient, SmsIrSendingService>();
            builder.Services.AddScoped<IPhoneVerificationService, PhoneVerificationService>();
            builder.Services.AddScoped<ISmsNotificationService, SmsNotificationService>();
            builder.Services.AddScoped<ISecuritySettingsProvider, SecuritySettingsProvider>();
            builder.Services.AddScoped<IIPBlacklistCommandRepository, IPBlacklistCommandRepository>();
            builder.Services.AddSingleton<IRateLimiterService, InMemoryRateLimiterService>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Core.Contracts.Auth.ILoginPuzzleCaptchaService,
                ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Authentication.LoginPuzzleCaptchaService>();
            builder.Services.Configure<PaymentGatewayOptions>(configuration.GetSection(PaymentGatewayOptions.SectionName));
            builder.Services.AddSingleton<ISecretProtector, ArkaSoftwarePro.Src.Infrastructure.Integrations.Security.AesSecretProtector>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers.DesktopAccessEvaluator>();
            builder.Services.AddScoped<PaymentGatewaySettingsLoader>();
            builder.Services.AddSingleton<IPaymentGatewaySettingsCache, PaymentGatewaySettingsCache>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Authentication.DesktopWebHandoffService>();

            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.ApplicationService.CacheSettingsServices.CacheSettingsLoader>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Infrastructure.Integrations.LiveMedia.LiveMediaTransportSettingsLoader>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Infrastructure.Integrations.LiveMedia.LiveKitAccessTokenService>();
            builder.Services.AddSingleton<ICacheSettingsCache, ArkaSoftwarePro.Src.Core.ApplicationService.CacheSettingsServices.CacheSettingsCache>();
            builder.Services.AddSingleton<ArkaSoftwarePro.Src.Infrastructure.Integrations.Caching.RedisConnectionManager>();
            builder.Services.AddSingleton<IApplicationCacheService, ArkaSoftwarePro.Src.Infrastructure.Integrations.Caching.ApplicationCacheService>();
            builder.Services.AddSingleton<ICacheWarmupService, ArkaSoftwarePro.Src.Core.ApplicationService.CacheSettingsServices.CacheWarmupService>();
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.Caching.CacheAutoRefreshBackgroundService>();
            builder.Services.AddHttpClient("cache-warmup");

            builder.Services.AddHttpClient<RuntimeZarinPalClientAdapter>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(60);
                client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
            });
            builder.Services.AddScoped<IZarinPalClient>(sp => sp.GetRequiredService<RuntimeZarinPalClientAdapter>());

            builder.Services.AddHttpClient<RuntimeZibalClientAdapter>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(60);
                client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
            });
            builder.Services.AddScoped<IZibalClient>(sp => sp.GetRequiredService<RuntimeZibalClientAdapter>());

            builder.Services.AddHttpClient<RuntimeZibalPlatformClientAdapter>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(60);
                client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
            });
            builder.Services.AddScoped<IZibalPlatformClient>(sp => sp.GetRequiredService<RuntimeZibalPlatformClientAdapter>());

            builder.Services.AddHttpClient<IdPayGatewayService>((serviceProvider, client) =>
            {
                var gatewayOptions = serviceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<PaymentGatewayOptions>>().Value;
                client.DefaultRequestHeaders.Remove("X-API-KEY");
                client.DefaultRequestHeaders.Remove("X-SANDBOX");

                if (!string.IsNullOrWhiteSpace(gatewayOptions.ApiKey))
                    client.DefaultRequestHeaders.Add("X-API-KEY", gatewayOptions.ApiKey.Trim());

                if (gatewayOptions.UseSandbox)
                    client.DefaultRequestHeaders.Add("X-SANDBOX", "1");
            });

            builder.Services.AddScoped<ZarinPalGatewayService>();
            builder.Services.AddScoped<ZibalGatewayService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.IMediaEncryptionService,
                ArkaSoftwarePro.Src.Infrastructure.Integrations.DesktopDrm.MediaEncryptionService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.IContentKeyVault,
                ArkaSoftwarePro.Src.Infrastructure.Integrations.DesktopDrm.ContentKeyVault>();

            builder.Services.Configure<ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileStorageOptions>(
                configuration.GetSection(ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileStorageOptions.SectionName));
            builder.Services.AddHttpClient<ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.MsgHttpFileStorage>(client =>
            {
                var baseUrl = configuration["FileStorage:AgentBaseUrl"]?.Trim().TrimEnd('/')
                    ?? "https://msg.arkasoftware.ir";
                client.BaseAddress = new Uri(baseUrl + "/");
                client.Timeout = TimeSpan.FromHours(2);
            });
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.LocalWwwrootFileStorage>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.FtpFileStorage>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.FileStorage.IRemoteUploadStorage>(sp =>
                sp.GetRequiredService<ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.FtpFileStorage>());
            builder.Services.AddHostedService<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.FileStorage.UploadCleanupBackgroundService>();
            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.FileStorage.IFileStorage>(sp =>
            {
                var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileStorageOptions>>().Value;
                var local = sp.GetRequiredService<ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.LocalWwwrootFileStorage>();
                var provider = (opts.Provider ?? "Ftp").Trim();
                if (provider.Equals("Local", StringComparison.OrdinalIgnoreCase))
                    return local;
                if (provider.Equals("Msg", StringComparison.OrdinalIgnoreCase))
                    return sp.GetRequiredService<ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.MsgHttpFileStorage>();
                if (provider.Equals("Ftp", StringComparison.OrdinalIgnoreCase))
                    return sp.GetRequiredService<ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.FtpFileStorage>();

                // Composite = FTP write + dual-read (FTP then local) — for hosts without a runnable Agent.
                var ftp = sp.GetRequiredService<ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.FtpFileStorage>();
                return new ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage.CompositeFileStorage(ftp, local);
            });

            builder.Services.AddScoped<ArkaSoftwarePro.Src.Core.Contracts.Finance.ITeacherPayoutTransferService, ArkaSoftwarePro.Src.Infrastructure.Integrations.Finance.TeacherPayoutTransferService>();
            builder.Services.AddSingleton<IPaymentGatewaySettingsProvider, PaymentGatewaySettingsProvider>();
            builder.Services.AddScoped<ClientPaymentGatewayFactory>();
            builder.Services.AddScoped<IPaymentAttemptStore, PaymentAttemptStore>();
            builder.Services.AddScoped<IBusinessTransactionRunner,
                ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Services.BusinessTransactionRunner>();
            builder.Services.AddScoped<TrackedPaymentService>();



            builder.Services.AddTransient<CommandDispatcherDecorator, CustomCommandDecorator>();
            builder.Services.AddTransient<QueryDispatcherDecorator, CustomQueryDecorator>();
            builder.Services.AddSingleton<EventDispatcherDecorator, CustomEventDecorator>();


            builder.Services.AddSecurityDependencies(configuration);
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultScheme = "Smart";
                //options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme; // پیش‌فرض کوکی

            })
            .AddPolicyScheme("Smart", "Authorization Bearer or Cookie", options =>
            {
                options.ForwardDefaultSelector = context =>
                {
                    var hasBearer = context.Request.Headers["Authorization"].ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                        || context.Request.Query.ContainsKey("access_token") && (context.Request.Path.StartsWithSegments("/hubs") || context.Request.Path.StartsWithSegments("/meetingHub"));
                    return hasBearer ? JwtBearerDefaults.AuthenticationScheme : CookieAuthenticationDefaults.AuthenticationScheme;
                };
            })
            .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
            {
                options.Cookie.Name = "AuthCookie";
                options.Cookie.HttpOnly = true;
                // همیشه Secure باشد تا SameSite=None کار کند (حتی اگر پشت پروکسی HTTP باشد)
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                // برای پشتیبانی از Cross-Origin از None استفاده می‌کنیم
                options.Cookie.SameSite = SameSiteMode.None;
                var cookieExpireMinutes = configuration.GetValue("Cookie:ExpireTime", 300);
                options.ExpireTimeSpan = TimeSpan.FromMinutes(cookieExpireMinutes);
                options.SlidingExpiration = true;
                options.Cookie.Path = "/";

                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = 401;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = 403;
                    return Task.CompletedTask;
                };
            })
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                // Map JWT short names (e.g. "sub") to ClaimTypes.* so controllers can use NameIdentifier consistently.
                options.MapInboundClaims = true;
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        if (!ArkaSoftwarePro.Src.Infrastructure.Integrations.Security.RoomSeatTokenScope.Allows(context.Principal, context.Request.Path))
                            context.Fail("A room-seat token cannot access account APIs.");
                        return Task.CompletedTask;
                    },
                    OnMessageReceived = async context =>
                    {
                        // Only pass a real JWT here. "AuthCookie" holds the encrypted cookie-auth ticket, not a JWT.
                        var bearer = context.Request.Headers.Authorization.ToString();
                        var tokenFromHeader = bearer.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                            ? bearer["Bearer ".Length..].Trim()
                            : null;
                        var token = tokenFromHeader;
                        if (string.IsNullOrWhiteSpace(token) &&
                            (context.Request.Path.StartsWithSegments("/hubs") || context.Request.Path.StartsWithSegments("/meetingHub")))
                            token = context.Request.Query["access_token"].FirstOrDefault();
                        token ??= context.Request.Cookies["authToken"];

                        if (!string.IsNullOrEmpty(token))
                            context.Token = token;

                        await Task.CompletedTask;
                    }
                };
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:JwtIssuer"] ?? string.Empty,
                    ValidAudience = configuration["Jwt:JwtAudience"] ?? string.Empty,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:JwtSignKey"] ?? string.Empty))
                };

            }).AddGoogle(options =>
            {
                IConfigurationSection googleAuthSection = builder.Configuration.GetSection("Authentication:Google");
                options.ClientId = googleAuthSection["ClientId"]!;
                options.ClientSecret = googleAuthSection["ClientSecret"]!;
            });


            builder.Services.AddAuthorization(options =>
            {
                // Just Client Login With Cookie
                options.AddPolicy("CookiePolicy", policy =>
                {
                    policy.AuthenticationSchemes.Add(CookieAuthenticationDefaults.AuthenticationScheme);
                    policy.RequireAuthenticatedUser();
                });

                // Just Client Login With JWT Token
                options.AddPolicy("JwtPolicy", policy =>
                {
                    policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
                    policy.RequireAuthenticatedUser();
                });

                // Client Login With Cookie And Token
                options.AddPolicy("SmartPolicy", policy =>
                {
                    policy.AuthenticationSchemes.Add("Smart");
                    policy.RequireAuthenticatedUser();
                });

                // Login With Permission Role
                options.AddPolicy("AdminOnly", policy =>
                {
                    policy.RequireRole("ADMIN");
                });
            });


            var allowedOrigins = GetAllowedOrigins(configuration);
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    corsPolicyBuilder =>
                    {
                        corsPolicyBuilder.WithOrigins(allowedOrigins)
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials()
                            .SetPreflightMaxAge(TimeSpan.FromHours(1));
                    });
            });
            builder.Services.AddSignalR(options =>
            {
                options.MaximumParallelInvocationsPerClient = 1;
                options.MaximumReceiveMessageSize = 4 * 1024 * 1024;
                options.EnableDetailedErrors = builder.Environment.IsDevelopment();
                options.KeepAliveInterval = TimeSpan.FromSeconds(20);
                options.ClientTimeoutInterval = TimeSpan.FromSeconds(120);
                options.HandshakeTimeout = TimeSpan.FromSeconds(30);
            });

            //builder.Services.AddArkaSoftwareApiAuthentication(configuration, "OAuth");
            builder.Services.AddSwagger(configuration, builder.Environment, "Swagger");
            return builder.Build();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="app"></param>
        /// <returns></returns>
        public static WebApplication ConfigurePipeline(this WebApplication app)
        {
            var allowedOrigins = GetAllowedOrigins(app.Configuration);
            var allowedOriginSet = new HashSet<string>(allowedOrigins, StringComparer.OrdinalIgnoreCase);

            app.UseArkaSoftwareApiExceptionHandler();
            app.UseSerilogRequestLogging();
            app.Use(async (context, next) =>
            {
                var path = context.Request.Path.Value ?? "";
                if (HttpMethods.IsOptions(context.Request.Method) &&
                    (path.StartsWith("/meetingHub", StringComparison.OrdinalIgnoreCase)
                     || path.StartsWith("/hubs/", StringComparison.OrdinalIgnoreCase)))
                {
                    var origin = context.Request.Headers.Origin.ToString().Trim().TrimEnd('/');
                    if (!string.IsNullOrEmpty(origin) && allowedOriginSet.Contains(origin))
                    {
                        context.Response.Headers.AccessControlAllowOrigin = origin;
                        context.Response.Headers.AccessControlAllowCredentials = "true";
                        context.Response.Headers.AccessControlAllowMethods = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
                        context.Response.Headers.Vary = "Origin";
                        var reqHeaders = context.Request.Headers.AccessControlRequestHeaders.ToString();
                        if (!string.IsNullOrEmpty(reqHeaders))
                            context.Response.Headers.AccessControlAllowHeaders = reqHeaders;
                        context.Response.StatusCode = StatusCodes.Status204NoContent;
                        return;
                    }
                }
                if (path.StartsWith("/seminars/video", StringComparison.OrdinalIgnoreCase)
                    || path.StartsWith("/seminars/recordings", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsync("Seminar media is only available through the secured API endpoints.");
                    return;
                }
                await next();
            });
            app.UseStaticFiles();
            app.UseSwaggerUI("Swagger");
            app.UseStatusCodePages();
            app.UseRequestLocalization(options =>
            {
                var supportedCultures = new[] { new CultureInfo("en-US"), new CultureInfo("fa-IR") };
                options.DefaultRequestCulture = new RequestCulture("fa-IR");
                options.SupportedCultures = supportedCultures;
                options.SupportedUICultures = supportedCultures;
            });
            //if (app.Environment.IsDevelopment())
            //{
            //    app.UseDeveloperExceptionPage();
            //}
            if (app.Environment.IsDevelopment())
                app.UseDeveloperExceptionPage();
            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseCors("AllowAll");
            app.UseIpBlockedGuard();
            app.UseAuthentication();
            app.UseBlockedAccountGuard();
            app.UseAuthorization();
            app.MapControllers();//.RequireAuthorization();
            app.MapHub<MeetingHub>("/meetingHub", options =>
            {
                // Finish idle polls before intermediary proxies expire the HTTP request.
                options.LongPolling.PollTimeout = TimeSpan.FromSeconds(20);
            }).RequireCors("AllowAll");
            app.MapHub<ChatHub>("/hubs/chat").RequireCors("AllowAll");
            app.MapHub<ProjectQaHub>("/hubs/project-qa").RequireCors("AllowAll");
            app.MapHub<CommunityQaHub>("/hubs/community-qa").RequireCors("AllowAll");
            app.MapHub<EngagementHub>("/hubs/engagement").RequireCors("AllowAll");
            app.MapHub<SupportChatHub>("/hubs/support-chat").RequireCors("AllowAll");
            app.MapHub<RemoteAssistHub>("/hubs/remote-assist").RequireCors("AllowAll");
            app.MapHub<PlatformSupportTicketHub>("/hubs/platform-support-ticket").RequireCors("AllowAll");

            return app;
        }

        private static string[] GetAllowedOrigins(IConfiguration configuration)
        {
            var fromConfig = configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
            var defaults = new[]
            {
                "https://arkasoftware.ir",
                "https://www.arkasoftware.ir",
                "https://admin-dashboard.arkasoftware.ir"
            };

            return defaults
                .Concat(fromConfig)
                .Select(static origin => origin.Trim().TrimEnd('/'))
                .Where(static origin => !string.IsNullOrWhiteSpace(origin))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

    }
}
