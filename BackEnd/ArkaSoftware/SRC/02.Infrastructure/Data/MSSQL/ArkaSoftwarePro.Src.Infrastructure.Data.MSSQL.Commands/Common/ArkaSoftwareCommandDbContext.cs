using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.AboutUsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ContactUsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SiteAnnouncementAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.NewsletterAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EmailSettingsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.GoogleAuthSettingsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CacheSettingsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DatabaseConnectionSettingsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SecuritySettingsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.MediaUploadSettingsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EmailTemplateAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SessionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserFileAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.PlatformSupportTopicAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserActivityAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DesktopAppReleaseAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.FileStorageAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Entities;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common
{
    public class ArkaSoftwareCommandDbContext(DbContextOptions<ArkaSoftwareCommandDbContext> options)
        : BaseOutboxCommandDbContext(options)
    {

        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<CourseLessonWatchProgress> CourseLessonWatchProgress { get; set; }
        public DbSet<EducationPlan> EducationPlans { get; set; }
        public DbSet<Teacher> Teachers { get; set; }
        public DbSet<TeacherTeachingCategory> TeacherTeachingCategories { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<ManagedRoomStudent> ManagedRoomStudents { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Basket> Baskets { get; set; }
        public DbSet<DiscountCode> DiscountCodes { get; set; }
        public DbSet<DiscountCodeCourseTarget> DiscountCodeCourses { get; set; }
        public DbSet<Article> Articles { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ArticleReaction> ArticleReactions { get; set; }
        public DbSet<Seminar> Seminars { get; set; }
        public DbSet<FavoriteCourse> FavoriteCourses { get; set; }
        public DbSet<FavoriteSeminar> FavoriteSeminars { get; set; }
        public DbSet<FavoriteArticle> FavoriteArticles { get; set; }
        public DbSet<AboutUsPage> AboutUsPages { get; set; }
        public DbSet<AboutUsTeamMember> AboutUsTeamMembers { get; set; }
        public DbSet<ContactUsPage> ContactUsPages { get; set; }
        public DbSet<SiteAnnouncement> SiteAnnouncements { get; set; }
        public DbSet<NewsletterSubscriber> NewsletterSubscribers { get; set; }
        public DbSet<NotificationSettings> NotificationSettings { get; set; }
        public DbSet<EmailSettings> EmailSettings { get; set; }
        public DbSet<GoogleAuthSettings> GoogleAuthSettings { get; set; }
        public DbSet<SecuritySettings> SecuritySettings { get; set; }
        public DbSet<MediaUploadSettings> MediaUploadSettings { get; set; }
        public DbSet<LiveMediaTransportSettings> LiveMediaTransportSettings { get; set; }
        public DbSet<CacheSettings> CacheSettings { get; set; }
        public DbSet<DatabaseConnectionSettings> DatabaseConnectionSettings { get; set; }
        public DbSet<IPBlacklist> IPBlacklists { get; set; }
        public DbSet<EmailTemplate> EmailTemplates { get; set; }
        public DbSet<RoomSession> RoomSessions { get; set; }
        public DbSet<UserFile> UserFiles { get; set; }
        public DbSet<MediaAsset> MediaAssets { get; set; }
        public DbSet<PlatformSupportTopic> PlatformSupportTopics { get; set; }
        public DbSet<SupportTicket> SupportTickets { get; set; }
        public DbSet<SupportTicketMessage> SupportTicketMessages { get; set; }
        public DbSet<AdminAnnouncement> AdminAnnouncements { get; set; }
        public DbSet<ProjectOrder> ProjectOrders { get; set; }
        public DbSet<UserNotification> UserNotifications { get; set; }
        public DbSet<ProjectQuestion> ProjectQuestions { get; set; }
        public DbSet<ProjectAnswer> ProjectAnswers { get; set; }
        public DbSet<ProjectAnswerLike> ProjectAnswerLikes { get; set; }
        public DbSet<CommunityThread> CommunityThreads { get; set; }
        public DbSet<CommunityReply> CommunityReplies { get; set; }
        public DbSet<CommunityReplyLike> CommunityReplyLikes { get; set; }
        public DbSet<CommunityThreadReaction> CommunityThreadReactions { get; set; }
        public DbSet<CommunityThreadSubscription> CommunityThreadSubscriptions { get; set; }
        public DbSet<Exam> Exams { get; set; }
        public DbSet<ExamAttempt> ExamAttempts { get; set; }
        public DbSet<BankQuestion> BankQuestions { get; set; }
        public DbSet<PlatformFinanceSettings> PlatformFinanceSettings { get; set; }
        public DbSet<TeacherWallet> TeacherWallets { get; set; }
        public DbSet<TeacherCourseSale> TeacherCourseSales { get; set; }
        public DbSet<TeacherPayoutRequest> TeacherPayoutRequests { get; set; }
        public DbSet<UserWallet> UserWallets { get; set; }
        public DbSet<WalletTransaction> WalletTransactions { get; set; }
        public DbSet<TeacherFollow> TeacherFollows { get; set; }
        public DbSet<TeacherResume> TeacherResumes { get; set; }
        public DbSet<SupportConversation> SupportConversations { get; set; }
        public DbSet<SupportMessage> SupportMessages { get; set; }
        public DbSet<SupportChatSmsReminder> SupportChatSmsReminders { get; set; }
        public DbSet<CalendarEvent> CalendarEvents { get; set; }
        public DbSet<CalendarEventParticipant> CalendarEventParticipants { get; set; }
        public DbSet<CalendarEventReminderDispatch> CalendarEventReminderDispatches { get; set; }
        public DbSet<CalendarEventScheduledReminder> CalendarEventScheduledReminders { get; set; }
        public DbSet<SupportConversationRating> SupportConversationRatings { get; set; }
        public DbSet<SupportPlanTariff> SupportPlanTariffs { get; set; }
        public DbSet<SupportPlanTariffFeature> SupportPlanTariffFeatures { get; set; }
        public DbSet<StudentSupportSubscription> StudentSupportSubscriptions { get; set; }
        public DbSet<StudentSupportFeatureGrant> StudentSupportFeatureGrants { get; set; }
        public DbSet<SupportPlanPendingPurchase> SupportPlanPendingPurchases { get; set; }
        public DbSet<StudentSupportFreezeRecord> StudentSupportFreezeRecords { get; set; }
        public DbSet<UserActivityEvent> UserActivityEvents { get; set; }

        // Desktop messenger extensions (SupportChat)
        public DbSet<SupportTeacherStory> SupportTeacherStories { get; set; }
        public DbSet<SupportTeacherStoryView> SupportTeacherStoryViews { get; set; }
        public DbSet<DesktopUserPresence> DesktopUserPresences { get; set; }

        // Desktop DRM / license / remote assist / releases
        public DbSet<DesktopAppLicense> DesktopAppLicenses { get; set; }
        public DbSet<OfflinePlaybackGrant> OfflinePlaybackGrants { get; set; }
        public DbSet<DesktopDeviceRegistration> DesktopDeviceRegistrations { get; set; }
        public DbSet<DesktopAccessBlock> DesktopAccessBlocks { get; set; }
        public DbSet<RemoteAssistSession> RemoteAssistSessions { get; set; }
        public DbSet<DesktopAppRelease> DesktopAppReleases { get; set; }
        public DbSet<MediaContentKey> MediaContentKeys { get; set; }
        public DbSet<CourseDesktopWatermarkPolicy> CourseDesktopWatermarkPolicies { get; set; }
        public DbSet<CourseCurriculumMaterial> CourseCurriculumMaterials { get; set; }
        public DbSet<DesktopLicenseDeviceBinding> DesktopLicenseDeviceBindings { get; set; }
        public DbSet<DesktopLicenseLessonAccess> DesktopLicenseLessonAccesses { get; set; }
        public DbSet<TeacherStudentSatisfaction> TeacherStudentRatings { get; set; }
        public DbSet<DesktopPlaybackEvent> DesktopPlaybackEvents { get; set; }
        public DbSet<FileStorageMigration> FileStorageMigrations { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.ApplyConfigurationsFromAssembly(typeof(ArkaSoftwareCommandDbContext).Assembly);
            base.OnModelCreating(builder);
        }
        
    }
}
