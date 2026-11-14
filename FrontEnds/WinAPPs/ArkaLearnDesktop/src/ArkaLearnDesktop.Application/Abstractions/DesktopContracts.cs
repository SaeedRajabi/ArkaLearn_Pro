using System.IO;
using ArkaLearnDesktop.Domain.Drm;

namespace ArkaLearnDesktop.Application.Abstractions;

public sealed record DesktopUserProfile(
    long UserId,
    string UserName,
    string DisplayName,
    string Email,
    string Role,
    string? AvatarUrl);

public sealed record DesktopLoginApiResult(
    bool Success,
    string? ErrorMessage,
    DesktopUserProfile? User,
    string? AccessToken,
    DateTime? ExpiresAtUtc);

/// <summary>Result of checking/restoring a persisted desktop session against the backend.</summary>
public enum DesktopSessionCheckStatus
{
    /// <summary>Backend accepted the session (or renewed JWT successfully).</summary>
    Valid = 0,
    /// <summary>Backend rejected the session — user must sign in again.</summary>
    Invalid = 1,
    /// <summary>Could not reach the backend — keep local session and allow offline use.</summary>
    Offline = 2,
}

public sealed record DesktopSessionCheckResult(
    DesktopSessionCheckStatus Status,
    string? Message = null);

public sealed record AppUpdateCheckResult(
    bool UpdateAvailable,
    bool IsMandatory,
    string CurrentVersion,
    string? LatestVersion,
    string? InstallerUrl,
    string? ReleaseNotes);

public sealed record DesktopEncryptedMediaItem(
    long MediaAssetId,
    string Title,
    string OriginalFileName,
    string MimeType,
    long FileSizeBytes,
    string? EncryptedFileUrl,
    long? CourseId,
    string? CourseTitle);

public sealed record DesktopLicensedCourse(
    long CourseId,
    string CourseTitle,
    string? DesktopLicenseKey,
    bool IsActive,
    long TeacherId,
    string TeacherName);

public sealed record DesktopTeacherCourseItem(
    long CourseId,
    string Title,
    string? Status,
    int StudentCount,
    decimal? Price,
    string? CategoryName);

public sealed record DesktopTeacherSearchItem(
    long TeacherId,
    long UserId,
    string DisplayName,
    string UserName,
    string? Email,
    string? AccountStatus,
    bool IsUserBlocked,
    string? ProfileApprovalStatus,
    int PublishedCourseCount);

public sealed record DesktopOnlineDesktopUser(
    long UserId,
    string DisplayName,
    string? Role,
    string Status,
    string? AppVersion,
    string? DeviceId,
    DateTime LastSeenAtUtc);

public sealed record DesktopPagedResult<T>(
    IReadOnlyList<T> Items,
    int PageNumber,
    int PageSize,
    int TotalCount);

public sealed record DesktopEnrolledStudent(
    long StudentId,
    long UserId,
    string FullName,
    string? UserName,
    string? Email,
    long CourseId,
    string CourseTitle,
    string EnrollmentDateTime,
    bool IsActive);

public sealed record DesktopStudentDesktopLicense(
    long EnrollmentId,
    long UserId,
    long StudentId,
    long CourseId,
    string CourseTitle,
    string? DesktopLicenseKey,
    bool IsDesktopLicenseActive,
    DateTime? DesktopLicenseExpiresAtUtc,
    bool IsCurrentlyValid,
    string EnrollmentDateTime);

public sealed record DesktopLicenseOperationResult(
    bool Success,
    string? ErrorMessage,
    DesktopStudentDesktopLicense? License);

public sealed record DesktopApproveEnrollmentResult(
    bool Success,
    string? ErrorMessage,
    long EnrollmentId,
    string? SpotPlayerLicense,
    string CourseTitle);

public sealed record DesktopOperationResult(
    bool Success,
    string? ErrorMessage);

public sealed record DesktopLicenseValidationResult(
    bool Success,
    string? ErrorMessage,
    long EnrollmentId,
    long CourseId,
    string CourseTitle,
    string LicenseKey);

public sealed record DesktopCourseLessonItem(
    long LessonId,
    string Title,
    string? VideoTitle,
    int DurationSeconds,
    bool IsPublished,
    long? MediaAssetId,
    bool HasEncryptedVideo,
    bool IsLocked,
    bool HasMaterials,
    IReadOnlyList<DesktopCourseCurriculumMaterialDto> Materials);

public sealed record DesktopCourseCurriculumMaterialDto(
    long MaterialId,
    long MediaAssetId,
    string DisplayName,
    string? OriginalFileName,
    long? FileSizeBytes,
    bool IsEncrypted);

public sealed record DesktopCourseSectionItem(
    long SectionId,
    string Title,
    bool HasMaterials,
    IReadOnlyList<DesktopCourseCurriculumMaterialDto> Materials,
    IReadOnlyList<DesktopCourseLessonItem> Lessons);

public sealed record DesktopCourseCurriculum(
    long CourseId,
    string CourseTitle,
    IReadOnlyList<DesktopCourseSectionItem> Sections);

public sealed record OfflineGrantResult(
    bool Success,
    string? ErrorMessage,
    string? GrantToken,
    long CourseId,
    DateTime? ExpiresAtUtc);

public sealed record DesktopPlaybackPackage(
    long MediaAssetId,
    string Title,
    string MimeType,
    string EncryptedFileUrl,
    string EncryptionAlgorithm,
    string IvBase64,
    string WrappedContentKeyBase64,
    string? ContentChecksumSha256,
    DateTime GrantExpiresAtUtc);

/// <summary>Streaming download of encrypted media (ciphertext only). Caller owns disposal.</summary>
public sealed class DesktopEncryptedDownload : IAsyncDisposable
{
    private readonly IDisposable?[] _lifetimes;

    public DesktopEncryptedDownload(Stream stream, long? contentLength, params IDisposable?[] lifetimes)
    {
        Stream = stream;
        ContentLength = contentLength;
        _lifetimes = lifetimes;
    }

    public Stream Stream { get; }
    public long? ContentLength { get; }

    public async ValueTask DisposeAsync()
    {
        await Stream.DisposeAsync().ConfigureAwait(false);
        foreach (var lifetime in _lifetimes)
            lifetime?.Dispose();
    }
}

public enum DesktopPlaybackTelemetryKind : byte
{
    Play = 1,
    Pause = 2,
    Seek = 3,
    Heartbeat = 4,
    Complete = 5,
}

public enum DesktopWatermarkPosition : byte
{
    TopLeft = 0,
    TopRight = 1,
    BottomLeft = 2,
    BottomRight = 3,
    Center = 4,
}

public enum DesktopWatermarkMovement : byte
{
    None = 0,
    Diagonal = 1,
}

public sealed record DesktopWatermarkStudentFields(
    string? FullName,
    string? Email,
    string? Phone);

public sealed record DesktopWatermarkPolicy(
    string TextTemplate,
    int FontSize,
    string FontColor,
    double Opacity,
    DesktopWatermarkPosition Position,
    double RotationDeg,
    DesktopWatermarkMovement Movement,
    int PaddingPx,
    bool PlatformLogoLocked);

public sealed record DesktopWatermarkForPlayback(
    long CourseId,
    DesktopWatermarkPolicy Policy,
    DesktopWatermarkStudentFields Student);

public sealed record DesktopAssignedExam(
    long ExamId,
    long? AttemptId,
    string Title,
    string CourseTitle,
    string Level,
    DateTime EndsAtUtc,
    int DurationMinutes,
    decimal TotalPoints,
    byte AttemptStatus,
    decimal? FinalScore,
    DateTime? ExpiresAtUtc);

public sealed record DesktopExamTakingOption(
    long Id,
    string Text,
    int OrderIndex);

public sealed record DesktopExamTakingQuestion(
    long Id,
    int OrderIndex,
    byte QuestionType,
    string Prompt,
    string? CodeSnippet,
    string? CodeLanguage,
    decimal Points,
    IReadOnlyList<DesktopExamTakingOption> Options);

public sealed record DesktopExamTakingAnswer(
    long QuestionId,
    string? SelectedOptionIdsJson,
    string? TextAnswer);

public sealed record DesktopExamTaking(
    long ExamId,
    long AttemptId,
    string Title,
    string CourseTitle,
    int DurationMinutes,
    DateTime EndsAtUtc,
    DateTime? ExpiresAtUtc,
    byte AttemptStatus,
    decimal TotalPoints,
    decimal? FinalScore,
    string? ProfessorFeedback,
    IReadOnlyList<DesktopExamTakingQuestion> Questions,
    IReadOnlyList<DesktopExamTakingAnswer> Answers);

public sealed record DesktopExamAnswerPayload(
    long QuestionId,
    string? SelectedOptionIdsJson,
    string? TextAnswer);

public sealed record DesktopStartExamAttemptResult(
    long AttemptId,
    DateTime ExpiresAtUtc);

public sealed record DesktopTeacherStudentSatisfactionItem(
    long Id,
    long CourseId,
    long EnrollmentId,
    long TeacherUserId,
    long StudentUserId,
    string? StudentName,
    byte Score,
    string? Note,
    DateTime UpdatedAtUtc);

public sealed record DesktopAccessStatus(
    bool IsAllowed,
    string? BlockReason,
    bool IsDeviceBlocked,
    bool IsUserBlocked,
    string? BlockScope);

public interface IDesktopApiClient
{
    Task<DesktopLoginApiResult> LoginAsync(string userNameOrEmail, string password, CancellationToken cancellationToken = default);
    Task<bool> ValidateSessionAsync(CancellationToken cancellationToken = default);
    /// <summary>
    /// Verifies the stored session with the backend and renews the JWT when the access token
    /// has expired but the server UserSession is still valid.
    /// </summary>
    Task<DesktopSessionCheckResult> EnsureSessionAsync(CancellationToken cancellationToken = default);
    Task<AppUpdateCheckResult> CheckForUpdateAsync(string currentVersion, CancellationToken cancellationToken = default);
    Task<DesktopAccessStatus> RegisterDesktopDeviceAsync(string appVersion, CancellationToken cancellationToken = default);
    Task LogoutDesktopSessionAsync(CancellationToken cancellationToken = default);
    Task<DesktopAccessStatus> GetDesktopAccessStatusAsync(bool checkVideoPlayback = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopEncryptedMediaItem>> GetEncryptedMediaAsync(CancellationToken cancellationToken = default);
    Task<DesktopLicenseValidationResult> ValidateDesktopLicenseAsync(string licenseKey, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopLicensedCourse>> GetMyLicensedCoursesAsync(CancellationToken cancellationToken = default);
    Task<DesktopCourseCurriculum?> GetCourseCurriculumAsync(long courseId, string? licenseKey, CancellationToken cancellationToken = default);
    Task<OfflineGrantResult> RequestOfflineGrantAsync(long courseId, string deviceId, CancellationToken cancellationToken = default);
    Task<DesktopPlaybackPackage?> GetPlaybackPackageAsync(long mediaAssetId, string grantToken, long? courseId, CancellationToken cancellationToken = default);
    Task<byte[]> DownloadEncryptedBytesAsync(string encryptedFileUrl, CancellationToken cancellationToken = default);
    Task<DesktopEncryptedDownload> OpenEncryptedDownloadAsync(string encryptedFileUrl, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopChatThread>> GetSupportConversationsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopSupportTeacherOption>> GetStudentSupportTeachersAsync(CancellationToken cancellationToken = default);
    Task<long?> OpenSupportConversationAsync(long teacherUserId, string subject, string? initialMessageHtml = null, CancellationToken cancellationToken = default);
    Task<DesktopConversationDetail?> GetSupportConversationAsync(long conversationId, int messageTake = 30, long? beforeMessageId = null, CancellationToken cancellationToken = default);
    Task<long?> SendSupportMessageAsync(long conversationId, string contentHtml, long? replyToMessageId = null, string? clientMessageId = null, CancellationToken cancellationToken = default);
    Task<bool> UpdateSupportMessageAsync(long conversationId, long messageId, string contentHtml, CancellationToken cancellationToken = default);
    Task<bool> DeleteSupportMessageAsync(long conversationId, long messageId, CancellationToken cancellationToken = default);
    Task MarkSupportConversationReadAsync(long conversationId, CancellationToken cancellationToken = default);
    Task<DesktopChatUploadResult> UploadSupportChatMediaAsync(string filePath, DesktopChatMediaKind mediaKind, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopTeacherStory>> GetActiveStoriesAsync(CancellationToken cancellationToken = default);
    Task<DesktopStoryPublishResult> PublishStoryAsync(
        string caption,
        string? mediaUrl,
        int mediaKind,
        int? durationSeconds = null,
        string? thumbnailUrl = null,
        CancellationToken cancellationToken = default);
    Task<bool> RegisterStoryViewAsync(long storyId, CancellationToken cancellationToken = default);
    Task<bool> DeleteStoryAsync(long storyId, CancellationToken cancellationToken = default);
    Task<DesktopStoryUploadResult> UploadStoryMediaAsync(
        string filePath,
        string? mediaKindHint = null,
        CancellationToken cancellationToken = default);
    Task HeartbeatPresenceAsync(string? connectionId, string? appVersion, string? deviceId, bool isOnline = true, CancellationToken cancellationToken = default);
    Task<bool> GetUserPresenceOnlineAsync(long userId, CancellationToken cancellationToken = default);
    Task<bool> GetVipAccessAsync(CancellationToken cancellationToken = default);
    Task<string?> CreateWebHandoffCodeAsync(string? returnUrl = null, CancellationToken cancellationToken = default);
    Task<DesktopRemoteAssistSession?> GetMyRemoteAssistSessionAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopRemoteAssistSession>> GetPendingRemoteAssistSessionsAsync(CancellationToken cancellationToken = default);
    Task<DesktopRemoteAssistRequestResult> EnsureRemoteAssistSessionAsync(CancellationToken cancellationToken = default);
    Task<DesktopRemoteAssistRequestResult> RequestRemoteAssistSessionAsync(CancellationToken cancellationToken = default);
    Task<DesktopRemoteAssistRequestResult> ChangeRemoteAssistPasswordAsync(long sessionId, string? newPassword = null, CancellationToken cancellationToken = default);
    Task<DesktopRemoteAssistAcceptResult> AcceptRemoteAssistSessionAsync(string sessionCode, string sessionUsername, string sessionPassword, CancellationToken cancellationToken = default);
    Task<DesktopRemoteAssistRequestResult> ConfirmRemoteAssistConsentAsync(
        long sessionId,
        bool allowRemoteControl,
        bool allowClipboard,
        bool allowFileTransfer,
        bool allowAudio,
        bool allowLockLocalInput,
        CancellationToken cancellationToken = default);
    Task<DesktopRemoteAssistRequestResult> DenyRemoteAssistConsentAsync(long sessionId, CancellationToken cancellationToken = default);
    Task<DesktopRemoteAssistHistoryPage> GetRemoteAssistHistoryAsync(long? studentUserId = null, long? teacherUserId = null, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<bool> EndRemoteAssistSessionAsync(long sessionId, CancellationToken cancellationToken = default);
    Task<int> DeleteRemoteAssistHistoryAsync(long? sessionId = null, long? studentUserId = null, long? teacherUserId = null, CancellationToken cancellationToken = default);
    Task<DesktopPagedResult<DesktopTeacherCourseItem>> SearchMyCoursesAsync(
        string? search = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);
    Task<DesktopPagedResult<DesktopTeacherCourseItem>> SearchCoursesAsync(
        string? search = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);
    Task<DesktopPagedResult<DesktopTeacherSearchItem>> SearchTeachersAsync(
        string? search = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);
    Task<DesktopOperationResult> SetTeacherAccountStatusAsync(
        long teacherId,
        string status,
        string? note = null,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopOnlineDesktopUser>> GetOnlineDesktopUsersAsync(
        int take = 200,
        CancellationToken cancellationToken = default);
    Task<DesktopOperationResult> BlockDesktopUserAccessAsync(
        long userId,
        string? reason = null,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopEnrolledStudent>> GetMyEnrolledStudentsAsync(CancellationToken cancellationToken = default);
    Task<DesktopOperationResult> RemoveMyStudentAsync(long portalUserId, CancellationToken cancellationToken = default);
    Task<DesktopApproveEnrollmentResult> ApproveEnrollmentAsync(long enrollmentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopStudentDesktopLicense>> GetStudentDesktopLicensesAsync(long userId, CancellationToken cancellationToken = default);
    Task<DesktopLicenseOperationResult> CreateStudentDesktopLicenseAsync(
        long userId,
        long courseId,
        DateTime? expiresAtUtc = null,
        CancellationToken cancellationToken = default);
    Task<DesktopLicenseOperationResult> RevokeStudentDesktopLicenseAsync(long enrollmentId, CancellationToken cancellationToken = default);
    Task<DesktopLicenseOperationResult> RenewStudentDesktopLicenseAsync(
        long enrollmentId,
        DateTime? expiresAtUtc = null,
        CancellationToken cancellationToken = default);
    Task<DesktopLicenseOperationResult> RegenerateStudentDesktopLicenseAsync(
        long enrollmentId,
        DateTime? expiresAtUtc = null,
        CancellationToken cancellationToken = default);
    Task<DesktopWatermarkForPlayback?> GetWatermarkForPlaybackAsync(long courseId, CancellationToken cancellationToken = default);
    Task ReportPlaybackTelemetryAsync(
        long courseId,
        long lessonId,
        DesktopPlaybackTelemetryKind kind,
        int positionSeconds,
        int watchedDeltaSeconds,
        long? enrollmentId = null,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopAssignedExam>> GetMyAssignedExamsAsync(CancellationToken cancellationToken = default);
    Task<DesktopExamTaking?> GetExamForTakingAsync(long examId, CancellationToken cancellationToken = default);
    Task<DesktopStartExamAttemptResult?> StartExamAttemptAsync(long examId, CancellationToken cancellationToken = default);
    Task SaveExamAnswersAsync(long attemptId, IReadOnlyList<DesktopExamAnswerPayload> answers, CancellationToken cancellationToken = default);
    Task SubmitExamAttemptAsync(long attemptId, IReadOnlyList<DesktopExamAnswerPayload> answers, CancellationToken cancellationToken = default);
    Task AbandonExamAttemptAsync(long attemptId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopTeacherStudentSatisfactionItem>> GetTeacherStudentSatisfactionAsync(
        long courseId = 0,
        long enrollmentId = 0,
        CancellationToken cancellationToken = default);
    Task<DesktopAboutUsPage?> GetAboutUsPageAsync(CancellationToken cancellationToken = default);
    Task<DesktopContactUsPage?> GetContactUsPageAsync(CancellationToken cancellationToken = default);
}

public sealed record DesktopAboutUsPage(
    long Id,
    string HeroTitle,
    string HeroSubtitle,
    string IntroTitle,
    string IntroContentHtml,
    string MissionTitle,
    string MissionContentHtml,
    string VisionTitle,
    string VisionContentHtml,
    string ValuesTitle,
    string ValuesContentHtml,
    string TeamTitle,
    string TeamContentHtml,
    IReadOnlyList<DesktopAboutUsTeamMember> TeamMembers);

public sealed record DesktopAboutUsTeamMember(
    long Id,
    string FullName,
    string SkillTitle,
    string? ImageUrl,
    string? GithubUrl,
    string? LinkedinUrl,
    string? TwitterUrl,
    string? InstagramUrl,
    string? WebsiteUrl,
    int DisplayOrder);

public sealed record DesktopContactUsPage(
    long Id,
    string PageTitle,
    string PageSubtitle,
    string HeadquartersTitle,
    string HeadquartersAddress,
    string HeadquartersPhone,
    string HeadquartersEmail,
    string ContactInfoTitle,
    string ContactInfoPhone,
    string ContactInfoEmail,
    string SalesSupportTitle,
    string SalesSupportPhone,
    string SalesSupportEmail,
    string? FacebookUrl,
    string? TwitterUrl,
    string? InstagramUrl,
    string? LinkedInUrl);

public interface ICourseManagementContext
{
    long? SelectedCourseId { get; set; }
    string? SelectedCourseTitle { get; set; }
    event Action? SelectionChanged;
}

public sealed record DesktopRemoteAssistSession(
    long SessionId,
    long RequesterUserId,
    long? AcceptedByTeacherUserId,
    string OneTimeSessionCode,
    string SessionUsername,
    string? SessionPassword,
    string Status,
    DateTime CreatedAtUtc,
    DateTime CodeExpiresAtUtc,
    DateTime? AcceptedAtUtc,
    DateTime? EndedAtUtc,
    DateTime? ConsentRequestedAtUtc = null,
    bool AllowRemoteControl = true,
    bool AllowClipboard = false,
    bool AllowFileTransfer = false,
    bool AllowAudio = false,
    bool AllowLockLocalInput = false,
    string? RequesterDisplayName = null,
    string? RequesterPhoneNumber = null,
    string? HelperDisplayName = null);

public sealed record DesktopRemoteAssistHistoryPage(
    int PageNumber,
    int PageSize,
    int TotalCount,
    IReadOnlyList<DesktopRemoteAssistSession> Items);

public sealed record DesktopRemoteAssistRequestResult(
    bool Success,
    string? ErrorMessage,
    DesktopRemoteAssistSession? Session);

public sealed record DesktopRemoteAssistAcceptResult(
    bool Success,
    string? ErrorMessage,
    long SessionId,
    long RequesterUserId,
    string? Status = null);

public sealed record DesktopConversationDetail(
    long Id,
    long StudentUserId,
    long TeacherUserId,
    string Subject,
    string Status,
    bool HasMoreOlderMessages,
    IReadOnlyList<DesktopChatMessageDto> Messages);

public sealed record DesktopChatMessageDto(
    long Id,
    long SenderUserId,
    string SenderName,
    string ContentHtml,
    DateTime SentAtUtc,
    bool IsMine,
    bool IsDeleted,
    DateTime? EditedAtUtc = null,
    long? ReplyToMessageId = null,
    string? ReplyToSenderName = null,
    string? ReplyToContentPreview = null);

public interface IAuthSessionStore
{
    Task<DesktopUserProfile?> GetCurrentUserAsync(CancellationToken cancellationToken = default);
    Task<string?> GetAccessTokenAsync(CancellationToken cancellationToken = default);
    Task SaveAsync(DesktopUserProfile user, string accessToken, DateTime? expiresAtUtc, CancellationToken cancellationToken = default);
    Task ClearAsync(CancellationToken cancellationToken = default);
    Task<bool> HasValidSessionAsync(CancellationToken cancellationToken = default);
}

public interface IOfflineLicenseService
{
    Task<bool> HasValidOfflineGrantAsync(long courseId, string? deviceId = null, CancellationToken cancellationToken = default);
    Task<string?> GetGrantTokenAsync(long courseId, string? deviceId = null, CancellationToken cancellationToken = default);
    Task SaveGrantAsync(long courseId, string grantToken, DateTime expiresAtUtc, string deviceId, CancellationToken cancellationToken = default);
}

public interface ISecureMaterialDownloadService
{
    Task DownloadAsync(
        long courseId,
        DesktopCourseCurriculumMaterialDto material,
        string destinationPath,
        CancellationToken cancellationToken = default);
}

public interface IEncryptedMediaCacheStore
{
    Task<IReadOnlyList<LocalEncryptedMediaCache>> ListAsync(CancellationToken cancellationToken = default);
    Task<LocalEncryptedMediaCache?> GetByMediaIdAsync(long mediaAssetId, CancellationToken cancellationToken = default);
    Task UpsertAsync(LocalEncryptedMediaCache item, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(long mediaAssetId, CancellationToken cancellationToken = default);
}

/// <summary>Persists last watched position per encrypted media (local device only).</summary>
public interface IWatchPositionStore
{
    Task<int?> GetPositionSecondsAsync(long mediaAssetId, CancellationToken cancellationToken = default);
    Task SavePositionAsync(long mediaAssetId, int positionSeconds, int? durationSeconds = null, CancellationToken cancellationToken = default);
    Task ClearAsync(long mediaAssetId, CancellationToken cancellationToken = default);
}

public interface ISecurePlaybackService
{
    event EventHandler<bool>? BufferingChanged;
    event EventHandler<double>? DownloadProgressChanged;

    /// <summary>Returns a still-alive decrypted loopback URI if this media was recently prepared.</summary>
    bool TryGetCachedPlayback(long mediaAssetId, out Uri playbackUri);

    Task<Uri> StartRamPlaybackAsync(
        byte[] encryptedPayload,
        string encryptionAlgorithm,
        string ivBase64,
        string wrappedContentKeyBase64,
        string grantToken,
        string mimeType,
        long mediaAssetId = 0,
        CancellationToken cancellationToken = default);

    Task<Uri> StartProgressiveRamPlaybackAsync(
        Stream encryptedStream,
        long? encryptedContentLength,
        string encryptionAlgorithm,
        string ivBase64,
        string wrappedContentKeyBase64,
        string grantToken,
        string mimeType,
        Stream? encryptedCacheWriteStream = null,
        IAsyncDisposable? streamOwnership = null,
        long mediaAssetId = 0,
        CancellationToken cancellationToken = default);

    /// <summary>Detaches the active session without destroying plaintext (kept in LRU for fast resume).</summary>
    void ParkCurrentSession();

    /// <summary>Hard-dispose one or all RAM sessions (license clear / logout).</summary>
    void StopPlayback(Uri? sourceUri);
    void EvictAllSessions();
}

public interface IVipAccessService
{
    Task<bool> HasActiveVipSupportAsync(CancellationToken cancellationToken = default);
}

public sealed record DesktopChatThread(
    long RemoteConversationId,
    long PeerUserId,
    string PeerDisplayName,
    string Subject,
    string? LastMessagePreview,
    DateTime? LastMessageAtUtc,
    int UnreadCount,
    long TeacherUserId = 0,
    long StudentUserId = 0);

public sealed record DesktopSupportTeacherOption(
    long TeacherUserId,
    string DisplayName,
    string? Email,
    string? Source);

public enum DesktopChatMediaKind
{
    Image = 1,
    Audio = 2,
    Video = 3,
    File = 4,
}

public sealed record DesktopChatUploadResult(
    bool Success,
    string? ErrorMessage,
    string? MediaUrl,
    DesktopChatMediaKind MediaKind,
    string? FileName);

public sealed record DesktopChatMessage(
    long LocalId,
    long RemoteConversationId,
    long? RemoteMessageId,
    string? ClientMessageId,
    long SenderUserId,
    string SenderName,
    string ContentHtml,
    DateTime SentAtUtc,
    bool IsMine,
    bool IsDeleted,
    bool IsPending,
    string? SendError,
    DateTime? EditedAtUtc = null,
    long? ReplyToMessageId = null,
    string? ReplyToSenderName = null,
    string? ReplyToContentPreview = null);

public enum DesktopStoryMediaKind
{
    None = 0,
    Image = 1,
    Video = 2,
}

public sealed record DesktopTeacherStory(
    long Id,
    long TeacherUserId,
    string TeacherName,
    string Caption,
    string? MediaUrl,
    string? ThumbnailUrl,
    DateTime ExpiresAtUtc,
    DesktopStoryMediaKind MediaKind = DesktopStoryMediaKind.None,
    int DurationSeconds = 5,
    string? TeacherAvatarUrl = null,
    bool HasUnseen = false);

public sealed record DesktopStoryPublishResult(
    bool Success,
    string? ErrorMessage,
    long StoryId);

public sealed record DesktopStoryUploadResult(
    bool Success,
    string? ErrorMessage,
    string? MediaUrl,
    DesktopStoryMediaKind MediaKind);

public interface ISupportChatSyncService
{
    event Action? ThreadsChanged;
    event Action<long>? MessagesChanged;
    event Action<long, bool>? PresenceChanged;

    Task StartAsync(CancellationToken cancellationToken = default);
    Task StopAsync(CancellationToken cancellationToken = default);
    Task RefreshAsync(CancellationToken cancellationToken = default);
    Task SelectConversationAsync(long remoteConversationId, CancellationToken cancellationToken = default);
    Task SendMessageAsync(long remoteConversationId, string text, CancellationToken cancellationToken = default);
    Task SendHtmlMessageAsync(long remoteConversationId, string contentHtml, long? replyToMessageId = null, CancellationToken cancellationToken = default);
    Task UpdateMessageAsync(long remoteConversationId, long messageId, string contentHtml, CancellationToken cancellationToken = default);
    Task DeleteMessageAsync(long remoteConversationId, long messageId, CancellationToken cancellationToken = default);

    IReadOnlyList<DesktopTeacherStory> GetStories();
    bool IsPeerOnline(long peerUserId);

    Task<IReadOnlyList<DesktopChatThread>> GetThreadsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DesktopChatMessage>> GetMessagesAsync(long remoteConversationId, CancellationToken cancellationToken = default);
}

public interface IDesktopNavigationService
{
    void NavigateToLogin(string? errorMessage = null);
    void NavigateToShell(string? startPageTag = null);
    void NavigateShellPage(string pageTag);
    void OpenRemoteAssist();
    void NavigateToMandatoryUpdate(AppUpdateCheckResult update);
    void NavigateToScreenCaptureBlocked(IReadOnlyList<ScreenCaptureThreat> threats, Action onCleared);

    /// <summary>Hides the main shell sidebar for immersive surfaces (e.g. video fullscreen).</summary>
    void HideShellSidebar();

    /// <summary>Restores the shell sidebar after immersive mode.</summary>
    void RestoreShellSidebar();
}

public interface IDesktopTrayService : IDisposable
{
    void ShowMainWindow();
    void HideToTray(bool balloon = false);
    void RequestExit();
}
