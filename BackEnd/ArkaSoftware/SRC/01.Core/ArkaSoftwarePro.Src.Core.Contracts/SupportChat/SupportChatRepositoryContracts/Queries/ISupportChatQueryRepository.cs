using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetActiveTeacherStories;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetAdminTeacherSupportConversations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportConversations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetSupportConversationById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetStudentSupportTeachers;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.SearchAdminSupportTeachers;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;

public interface ISupportChatQueryRepository
{
    Task<List<SupportConversationListQri>> GetConversationsForUserAsync(
        long userId,
        long? studentUserId = null,
        CancellationToken cancellationToken = default);
    Task<PagedData<SupportStudentListQri>> GetSupportStudentsForTeacherAsync(
        GetMySupportStudentsQuery query,
        CancellationToken cancellationToken = default);
    Task<SupportConversationDetailQri?> GetConversationDetailAsync(
        long conversationId,
        long userId,
        int messageTake,
        long? beforeMessageId = null,
        CancellationToken cancellationToken = default);
    Task<PagedData<AdminSupportTeacherQri>> SearchTeachersForAdminAsync(
        SearchAdminSupportTeachersQuery query,
        CancellationToken cancellationToken = default);
    Task<List<AdminSupportConversationListQri>> GetConversationsForTeacherAdminAsync(
        long teacherUserId,
        CancellationToken cancellationToken = default);
    Task<SupportConversationDetailQri?> GetConversationDetailForAdminAsync(
        long conversationId,
        long teacherUserId,
        long staffUserId,
        int messageTake,
        long? beforeMessageId = null,
        CancellationToken cancellationToken = default);    Task<bool> HasConversationWithSubjectAsync(
        long studentUserId,
        long teacherUserId,
        string subject,
        long? excludeConversationId = null,
        CancellationToken cancellationToken = default);
    Task<List<StudentSupportTeacherQri>> GetStudentTeachersAsync(long studentUserId, CancellationToken cancellationToken = default);
    Task<bool> IsTeacherAllowedForStudentAsync(long studentUserId, long teacherUserId, CancellationToken cancellationToken = default);
    Task<bool> HasRatingAsync(long conversationId, CancellationToken cancellationToken = default);
    Task<Dictionary<long, (int TotalPoints, int Count)>> GetTeacherRatingAggregatesAsync(
        IReadOnlyList<long> teacherUserIds,
        CancellationToken cancellationToken = default);
    Task<List<TeacherStoryQri>> GetActiveTeacherStoriesAsync(
        long userId,
        bool isAdmin = false,
        CancellationToken cancellationToken = default);
    Task<string?> GetDesktopPresenceStatusAsync(
        long userId,
        CancellationToken cancellationToken = default);
    Task<List<DesktopOnlineUserQri>> GetOnlineDesktopUsersAsync(
        int take = 200,
        CancellationToken cancellationToken = default);
}

public sealed class DesktopOnlineUserQri
{
    public long UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AppVersion { get; set; }
    public string? DeviceId { get; set; }
    public DateTime LastSeenAtUtc { get; set; }
}
