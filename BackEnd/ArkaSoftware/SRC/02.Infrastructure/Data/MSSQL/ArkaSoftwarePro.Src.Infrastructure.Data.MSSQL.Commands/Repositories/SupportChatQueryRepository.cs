using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetActiveTeacherStories;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetAdminTeacherSupportConversations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportConversations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetStudentSupportTeachers;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetSupportConversationById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.SearchAdminSupportTeachers;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class SupportChatQueryRepository(ArkaSoftwareCommandDbContext commandDb)
    : ISupportChatQueryRepository
{
    public async Task<List<StudentSupportTeacherQri>> GetStudentTeachersAsync(
        long studentUserId,
        CancellationToken cancellationToken = default)
    {
        var map = await BuildTeacherMapAsync(studentUserId, cancellationToken);
        return map.Values.OrderBy(x => x.DisplayName).ToList();
    }

    public async Task<bool> IsTeacherAllowedForStudentAsync(
        long studentUserId,
        long teacherUserId,
        CancellationToken cancellationToken = default)
    {
        var map = await BuildTeacherMapAsync(studentUserId, cancellationToken);
        return map.ContainsKey(teacherUserId);
    }

    public async Task<List<SupportConversationListQri>> GetConversationsForUserAsync(
        long userId,
        long? studentUserId = null,
        CancellationToken cancellationToken = default)
    {
        var conversationsQuery = commandDb.SupportConversations.AsNoTracking()
            .Where(x => !x.IsDelete && (x.StudentUserId == userId || x.TeacherUserId == userId));

        if (studentUserId is > 0)
        {
            conversationsQuery = conversationsQuery.Where(x =>
                x.TeacherUserId == userId && x.StudentUserId == studentUserId.Value);
        }

        var conversations = await conversationsQuery
            .OrderByDescending(x => x.LastMessageAtUtc ?? x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        if (conversations.Count == 0) return [];

        var userIds = conversations
            .SelectMany(c => new[] { c.StudentUserId, c.TeacherUserId })
            .Distinct()
            .ToList();

        var users = await commandDb.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync(cancellationToken);
        var userMap = users.ToDictionary(u => u.Id, BuildUserDisplayName);

        var conversationIds = conversations.Select(c => c.Id).ToList();
        var allMessages = await commandDb.SupportMessages.AsNoTracking()
            .Where(m => conversationIds.Contains(m.ConversationId) && !m.IsDelete)
            .OrderByDescending(m => m.SentAtUtc)
            .ToListAsync(cancellationToken);
        var latestByConversation = allMessages
            .GroupBy(m => m.ConversationId)
            .ToDictionary(g => g.Key, g => g.First());

        var unreadCounts = new Dictionary<long, int>();
        foreach (var conv in conversations)
        {
            var lastRead = userId == conv.StudentUserId
                ? conv.StudentLastReadAtUtc
                : conv.TeacherLastReadAtUtc;

            var count = await commandDb.SupportMessages.AsNoTracking()
                .CountAsync(m =>
                    m.ConversationId == conv.Id &&
                    !m.IsDelete &&
                    (m.IsStaffMessage || m.SenderUserId != userId) &&
                    (lastRead == null || m.SentAtUtc > lastRead),
                    cancellationToken);
            unreadCounts[conv.Id] = count;
        }

        return conversations.Select(conv =>
        {
            var otherUserId = conv.StudentUserId == userId ? conv.TeacherUserId : conv.StudentUserId;
            userMap.TryGetValue(otherUserId, out var otherName);
            latestByConversation.TryGetValue(conv.Id, out var latest);

            return new SupportConversationListQri
            {
                Id = conv.Id,
                Subject = conv.Subject,
                Status = conv.Status.ToString().ToLowerInvariant(),
                StudentUserId = conv.StudentUserId,
                TeacherUserId = conv.TeacherUserId,
                OtherParticipantName = otherName ?? $"User #{otherUserId}",
                OtherParticipantEmail = users.FirstOrDefault(u => u.Id == otherUserId)?.EmailValue,
                CreatedAtUtc = conv.CreatedAtUtc,
                LastMessageAtUtc = conv.LastMessageAtUtc,
                UnreadCount = unreadCounts.GetValueOrDefault(conv.Id),
                LastMessagePreview = latest == null ? null : StripHtml(latest.ContentHtml, 120),
            };
        }).ToList();
    }

    public async Task<PagedData<SupportStudentListQri>> GetSupportStudentsForTeacherAsync(
        GetMySupportStudentsQuery query,
        CancellationToken cancellationToken = default)
    {
        var teacherUserId = query.TeacherUserId;
        var pageSize = query.PageSize is > 0 and <= 50 ? query.PageSize : 5;
        var search = (query.Search ?? string.Empty).Trim();
        var searchLower = search.ToLowerInvariant();

        var conversations = await commandDb.SupportConversations.AsNoTracking()
            .Where(x => !x.IsDelete && x.TeacherUserId == teacherUserId)
            .ToListAsync(cancellationToken);

        if (conversations.Count == 0)
        {
            return new PagedData<SupportStudentListQri>
            {
                QueryResult = [],
                TotalCount = 0,
                PageNumber = query.PageNumber,
                PageSize = pageSize,
            };
        }

        var conversationIds = conversations.Select(c => c.Id).ToList();
        var allMessages = await commandDb.SupportMessages.AsNoTracking()
            .Where(m => conversationIds.Contains(m.ConversationId) && !m.IsDelete)
            .OrderByDescending(m => m.SentAtUtc)
            .ToListAsync(cancellationToken);
        var latestByConversation = allMessages
            .GroupBy(m => m.ConversationId)
            .ToDictionary(g => g.Key, g => g.First());

        var studentIds = conversations.Select(c => c.StudentUserId).Distinct().ToList();
        var users = await commandDb.Users.AsNoTracking()
            .Where(u => studentIds.Contains(u.Id))
            .ToListAsync(cancellationToken);
        var userMap = users.ToDictionary(u => u.Id, BuildUserDisplayName);

        var grouped = conversations
            .GroupBy(c => c.StudentUserId)
            .Select(group =>
            {
                var latestConversation = group
                    .OrderByDescending(c => c.LastMessageAtUtc ?? c.CreatedAtUtc)
                    .First();
                latestByConversation.TryGetValue(latestConversation.Id, out var latestMessage);

                var unreadCount = 0;
                foreach (var conv in group)
                {
                    var lastRead = conv.TeacherLastReadAtUtc;
                    unreadCount += allMessages.Count(m =>
                        m.ConversationId == conv.Id &&
                        (m.IsStaffMessage || m.SenderUserId != teacherUserId) &&
                        (lastRead == null || m.SentAtUtc > lastRead));
                }

                userMap.TryGetValue(group.Key, out var displayName);
                var email = users.FirstOrDefault(u => u.Id == group.Key)?.EmailValue;

                return new SupportStudentListQri
                {
                    StudentUserId = group.Key,
                    DisplayName = displayName ?? $"User #{group.Key}",
                    Email = email,
                    TopicCount = group.Count(),
                    UnreadCount = unreadCount,
                    LastMessageAtUtc = latestConversation.LastMessageAtUtc ?? latestConversation.CreatedAtUtc,
                    LastMessagePreview = latestMessage == null ? null : StripHtml(latestMessage.ContentHtml, 120),
                };
            })
            .OrderByDescending(x => x.LastMessageAtUtc)
            .ToList();

        if (!string.IsNullOrWhiteSpace(searchLower))
        {
            grouped = grouped
                .Where(x =>
                    x.DisplayName.Contains(searchLower, StringComparison.OrdinalIgnoreCase) ||
                    (x.Email?.Contains(searchLower, StringComparison.OrdinalIgnoreCase) ?? false))
                .ToList();
        }

        var result = new PagedData<SupportStudentListQri>
        {
            TotalCount = query.NeedTotalCount ? grouped.Count : 0,
            PageNumber = query.PageNumber,
            PageSize = pageSize,
        };

        var page = grouped.Skip(query.SkipCount).Take(pageSize).ToList();
        if (!query.NeedTotalCount)
            result.TotalCount = page.Count;

        result.QueryResult = page;
        return result;
    }

    public async Task<SupportConversationDetailQri?> GetConversationDetailAsync(
        long conversationId,
        long userId,
        int messageTake,
        long? beforeMessageId = null,
        CancellationToken cancellationToken = default)
    {
        messageTake = messageTake is > 0 and <= 50 ? messageTake : 10;

        var conv = await commandDb.SupportConversations.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == conversationId && !x.IsDelete, cancellationToken);
        if (conv == null || (conv.StudentUserId != userId && conv.TeacherUserId != userId))
            return null;

        var messagesQuery = commandDb.SupportMessages.AsNoTracking()
            .Where(m => m.ConversationId == conversationId);

        if (beforeMessageId is > 0)
        {
            var beforeMessage = await commandDb.SupportMessages.AsNoTracking()
                .FirstOrDefaultAsync(
                    m => m.Id == beforeMessageId.Value && m.ConversationId == conversationId,
                    cancellationToken);
            if (beforeMessage != null)
            {
                var beforeSentAt = beforeMessage.SentAtUtc;
                var beforeId = beforeMessage.Id;
                messagesQuery = messagesQuery.Where(m =>
                    m.SentAtUtc < beforeSentAt ||
                    (m.SentAtUtc == beforeSentAt && m.Id < beforeId));
            }
        }

        var messages = await messagesQuery
            .OrderByDescending(m => m.SentAtUtc)
            .ThenByDescending(m => m.Id)
            .Take(messageTake)
            .ToListAsync(cancellationToken);
        messages.Reverse();

        var replyIds = messages
            .Where(m => m.ReplyToMessageId is > 0)
            .Select(m => m.ReplyToMessageId!.Value)
            .Distinct()
            .ToList();

        var replyTargets = replyIds.Count == 0
            ? []
            : await commandDb.SupportMessages.AsNoTracking()
                .Where(m => m.ConversationId == conversationId && replyIds.Contains(m.Id))
                .ToListAsync(cancellationToken);
        var replyMap = replyTargets.ToDictionary(m => m.Id);

        var hasMoreOlderMessages = false;
        if (messages.Count > 0)
        {
            var oldest = messages[0];
            hasMoreOlderMessages = await commandDb.SupportMessages.AsNoTracking()
                .AnyAsync(m =>
                    m.ConversationId == conversationId &&
                    (m.SentAtUtc < oldest.SentAtUtc ||
                     (m.SentAtUtc == oldest.SentAtUtc && m.Id < oldest.Id)),
                    cancellationToken);
        }

        var participantIds = new[] { conv.StudentUserId, conv.TeacherUserId }.Distinct().ToList();
        var users = await commandDb.Users.AsNoTracking()
            .Where(u => participantIds.Contains(u.Id))
            .ToListAsync(cancellationToken);
        var nameMap = users.ToDictionary(u => u.Id, BuildUserDisplayName);

        var hasRating = await commandDb.SupportConversationRatings.AsNoTracking()
            .AnyAsync(x => x.ConversationId == conversationId, cancellationToken);

        return new SupportConversationDetailQri
        {
            Id = conv.Id,
            Subject = conv.Subject,
            Status = conv.Status.ToString().ToLowerInvariant(),
            StudentUserId = conv.StudentUserId,
            TeacherUserId = conv.TeacherUserId,
            StudentName = nameMap.GetValueOrDefault(conv.StudentUserId) ?? $"User #{conv.StudentUserId}",
            TeacherName = nameMap.GetValueOrDefault(conv.TeacherUserId) ?? $"User #{conv.TeacherUserId}",
            CreatedAtUtc = conv.CreatedAtUtc,
            HasRating = hasRating,
            HasMoreOlderMessages = hasMoreOlderMessages,
            StudentLastReadAtUtc = conv.StudentLastReadAtUtc,
            TeacherLastReadAtUtc = conv.TeacherLastReadAtUtc,
            Messages = messages.Select(m =>
            {
                replyMap.TryGetValue(m.ReplyToMessageId ?? 0, out var replyTarget);
                return MapMessageQri(m, userId, nameMap, replyTarget, adminView: false, conv);
            }).ToList(),
        };
    }

    public async Task<PagedData<AdminSupportTeacherQri>> SearchTeachersForAdminAsync(
        SearchAdminSupportTeachersQuery query,
        CancellationToken cancellationToken = default)
    {
        var search = (query.InputValue ?? string.Empty).Trim();
        var searchLower = search.ToLowerInvariant();
        var pageSize = query.PageSize is > 0 and <= 50 ? query.PageSize : 7;

        // Project scalar columns only — EF cannot translate OrderBy on concatenated owned-type names.
        var rows = await (
            from t in commandDb.Teachers.AsNoTracking()
            join u in commandDb.Users.AsNoTracking() on t.UserId equals u.Id
            where !t.IsDelete && t.UserId != null && t.UserId > 0
            select new
            {
                TeacherId = t.Id,
                UserId = u.Id,
                FirstName = u.UserFullName != null ? u.UserFullName.FirstName : null,
                LastName = u.UserFullName != null ? u.UserFullName.LastName : null,
                UserName = u.UserName.Value,
                Email = u.Email.Value,
            }).ToListAsync(cancellationToken);

        IEnumerable<(long TeacherId, long UserId, string DisplayName, string? UserName, string? Email)> filtered = rows
            .Select(r =>
            {
                var displayName = BuildDisplayNameFromParts(r.FirstName, r.LastName, r.UserName);
                return (r.TeacherId, r.UserId, displayName, r.UserName, r.Email);
            });

        if (!string.IsNullOrWhiteSpace(searchLower))
        {
            filtered = filtered.Where(r =>
                (r.DisplayName.Contains(searchLower, StringComparison.OrdinalIgnoreCase)) ||
                (r.UserName?.Contains(searchLower, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (r.Email?.Contains(searchLower, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var sorted = filtered
            .OrderBy(r => r.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var result = new PagedData<AdminSupportTeacherQri>();
        result.TotalCount = query.NeedTotalCount ? sorted.Count : 0;

        var page = sorted
            .Skip(query.SkipCount)
            .Take(pageSize)
            .ToList();

        if (!query.NeedTotalCount)
            result.TotalCount = page.Count;

        var teacherIds = page.Select(x => x.TeacherId).ToList();
        var teacherUserIds = page.Select(x => x.UserId).ToList();

        var studentCounts = teacherIds.Count == 0
            ? []
            : await (
                from c in commandDb.Courses.AsNoTracking()
                join e in commandDb.Set<Enrollment>().AsNoTracking() on c.Id equals e.CourseId
                where c.TeacherId != null && teacherIds.Contains(c.TeacherId.Value) && e.IsActive
                group e by c.TeacherId into g
                select new { TeacherId = g.Key!.Value, Count = g.Select(x => x.StudentId).Distinct().Count() }
            ).ToDictionaryAsync(x => x.TeacherId, x => x.Count, cancellationToken);

        var conversationCounts = teacherUserIds.Count == 0
            ? []
            : await commandDb.SupportConversations.AsNoTracking()
                .Where(x => !x.IsDelete && teacherUserIds.Contains(x.TeacherUserId))
                .GroupBy(x => x.TeacherUserId)
                .Select(g => new { TeacherUserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TeacherUserId, x => x.Count, cancellationToken);

        result.QueryResult = page.Select(row => new AdminSupportTeacherQri
        {
            TeacherId = row.TeacherId,
            TeacherUserId = row.UserId,
            DisplayName = row.DisplayName,
            StudentCount = studentCounts.GetValueOrDefault(row.TeacherId),
            ConversationCount = conversationCounts.GetValueOrDefault(row.UserId),
        }).ToList();
        result.PageNumber = query.PageNumber;
        result.PageSize = pageSize;

        return result;
    }

    private static string BuildDisplayNameFromParts(string? firstName, string? lastName, string? userName)
    {
        var full = $"{firstName?.Trim() ?? ""} {lastName?.Trim() ?? ""}".Trim();
        if (!string.IsNullOrWhiteSpace(full)) return full;
        if (!string.IsNullOrWhiteSpace(userName)) return userName.Trim();
        return "Teacher";
    }

    public async Task<List<AdminSupportConversationListQri>> GetConversationsForTeacherAdminAsync(
        long teacherUserId,
        CancellationToken cancellationToken = default)
    {
        if (teacherUserId <= 0) return [];

        var conversations = await commandDb.SupportConversations.AsNoTracking()
            .Where(x => !x.IsDelete && x.TeacherUserId == teacherUserId)
            .OrderByDescending(x => x.LastMessageAtUtc ?? x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        if (conversations.Count == 0) return [];

        var studentIds = conversations.Select(c => c.StudentUserId).Distinct().ToList();
        var users = await commandDb.Users.AsNoTracking()
            .Where(u => studentIds.Contains(u.Id))
            .ToListAsync(cancellationToken);
        var nameMap = users.ToDictionary(u => u.Id, BuildUserDisplayName);

        var conversationIds = conversations.Select(c => c.Id).ToList();
        var allMessages = await commandDb.SupportMessages.AsNoTracking()
            .Where(m => conversationIds.Contains(m.ConversationId) && !m.IsDelete)
            .OrderByDescending(m => m.SentAtUtc)
            .ToListAsync(cancellationToken);
        var latestByConversation = allMessages
            .GroupBy(m => m.ConversationId)
            .ToDictionary(g => g.Key, g => g.First());

        return conversations.Select(conv =>
        {
            latestByConversation.TryGetValue(conv.Id, out var latest);
            return new AdminSupportConversationListQri
            {
                Id = conv.Id,
                Subject = conv.Subject,
                Status = conv.Status.ToString().ToLowerInvariant(),
                StudentUserId = conv.StudentUserId,
                StudentName = nameMap.GetValueOrDefault(conv.StudentUserId) ?? $"User #{conv.StudentUserId}",
                CreatedAtUtc = conv.CreatedAtUtc,
                LastMessageAtUtc = conv.LastMessageAtUtc,
                LastMessagePreview = latest == null ? null : StripHtml(latest.ContentHtml, 120),
            };
        }).ToList();
    }

    public async Task<SupportConversationDetailQri?> GetConversationDetailForAdminAsync(
        long conversationId,
        long teacherUserId,
        long staffUserId,
        int messageTake,
        long? beforeMessageId = null,
        CancellationToken cancellationToken = default)
    {
        messageTake = messageTake is > 0 and <= 50 ? messageTake : 10;

        var conv = await commandDb.SupportConversations.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == conversationId && !x.IsDelete, cancellationToken);
        if (conv == null || conv.TeacherUserId != teacherUserId)
            return null;

        var messagesQuery = commandDb.SupportMessages.AsNoTracking()
            .Where(m => m.ConversationId == conversationId);

        if (beforeMessageId is > 0)
        {
            var beforeMessage = await commandDb.SupportMessages.AsNoTracking()
                .FirstOrDefaultAsync(
                    m => m.Id == beforeMessageId.Value && m.ConversationId == conversationId,
                    cancellationToken);
            if (beforeMessage != null)
            {
                var beforeSentAt = beforeMessage.SentAtUtc;
                var beforeId = beforeMessage.Id;
                messagesQuery = messagesQuery.Where(m =>
                    m.SentAtUtc < beforeSentAt ||
                    (m.SentAtUtc == beforeSentAt && m.Id < beforeId));
            }
        }

        var messages = await messagesQuery
            .OrderByDescending(m => m.SentAtUtc)
            .ThenByDescending(m => m.Id)
            .Take(messageTake)
            .ToListAsync(cancellationToken);
        messages.Reverse();

        var replyIds = messages
            .Where(m => m.ReplyToMessageId is > 0)
            .Select(m => m.ReplyToMessageId!.Value)
            .Distinct()
            .ToList();

        var replyTargets = replyIds.Count == 0
            ? []
            : await commandDb.SupportMessages.AsNoTracking()
                .Where(m => m.ConversationId == conversationId && replyIds.Contains(m.Id))
                .ToListAsync(cancellationToken);
        var replyMap = replyTargets.ToDictionary(m => m.Id);

        var hasMoreOlderMessages = false;
        if (messages.Count > 0)
        {
            var oldest = messages[0];
            hasMoreOlderMessages = await commandDb.SupportMessages.AsNoTracking()
                .AnyAsync(m =>
                    m.ConversationId == conversationId &&
                    (m.SentAtUtc < oldest.SentAtUtc ||
                     (m.SentAtUtc == oldest.SentAtUtc && m.Id < oldest.Id)),
                    cancellationToken);
        }

        var participantIds = new[] { conv.StudentUserId, conv.TeacherUserId }.Distinct().ToList();
        var users = await commandDb.Users.AsNoTracking()
            .Where(u => participantIds.Contains(u.Id))
            .ToListAsync(cancellationToken);
        var nameMap = users.ToDictionary(u => u.Id, BuildUserDisplayName);

        return new SupportConversationDetailQri
        {
            Id = conv.Id,
            Subject = conv.Subject,
            Status = conv.Status.ToString().ToLowerInvariant(),
            StudentUserId = conv.StudentUserId,
            TeacherUserId = conv.TeacherUserId,
            StudentName = nameMap.GetValueOrDefault(conv.StudentUserId) ?? $"User #{conv.StudentUserId}",
            TeacherName = nameMap.GetValueOrDefault(conv.TeacherUserId) ?? $"User #{conv.TeacherUserId}",
            CreatedAtUtc = conv.CreatedAtUtc,
            HasRating = await HasRatingAsync(conversationId, cancellationToken),
            HasMoreOlderMessages = hasMoreOlderMessages,
            StudentLastReadAtUtc = conv.StudentLastReadAtUtc,
            TeacherLastReadAtUtc = conv.TeacherLastReadAtUtc,
            Messages = messages.Select(m =>
            {
                replyMap.TryGetValue(m.ReplyToMessageId ?? 0, out var replyTarget);
                return MapMessageQri(m, staffUserId, nameMap, replyTarget, adminView: true, conv);
            }).ToList(),
        };
    }

    private static SupportMessageQri MapMessageQri(
        SupportMessage m,
        long viewerUserId,
        Dictionary<long, string> nameMap,
        SupportMessage? replyTarget,
        bool adminView,
        SupportConversation conv)
    {
        var isStaff = m.IsStaffMessage;
        var senderName = ResolveSenderName(m, nameMap);
        var isMine = adminView
            ? isStaff && m.SenderUserId == viewerUserId
            : !isStaff && m.SenderUserId == viewerUserId;

        string? deliveryStatus = null;
        if (isMine)
        {
            var recipientLastRead = ResolveRecipientLastRead(m, conv);
            deliveryStatus = SupportChatDeliveryStatus.ResolveForSentMessage(
                m.SentAtUtc,
                m.DeliveredAtUtc,
                recipientLastRead);
        }

        return new SupportMessageQri
        {
            Id = m.Id,
            SenderUserId = m.SenderUserId,
            SenderName = senderName,
            ContentHtml = m.IsDelete ? string.Empty : m.ContentHtml,
            SentAtUtc = m.SentAtUtc,
            IsMine = isMine,
            IsDeleted = m.IsDelete,
            EditedAtUtc = m.EditedAtUtc,
            ReplyToMessageId = m.ReplyToMessageId,
            ReplyToSenderName = replyTarget == null
                ? null
                : ResolveSenderName(replyTarget, nameMap),
            ReplyToContentPreview = replyTarget == null
                ? null
                : replyTarget.IsDelete
                    ? null
                    : StripHtml(replyTarget.ContentHtml, 80),
            IsStaffMessage = isStaff,
            DeliveryStatus = deliveryStatus,
        };
    }

    private static DateTime? ResolveRecipientLastRead(SupportMessage message, SupportConversation conv)
    {
        if (message.IsStaffMessage)
            return conv.StudentLastReadAtUtc;

        if (message.SenderUserId == conv.StudentUserId)
            return conv.TeacherLastReadAtUtc;

        return conv.StudentLastReadAtUtc;
    }

    private static string ResolveSenderName(
        SupportMessage message,
        Dictionary<long, string> nameMap)
    {
        if (message.IsStaffMessage)
            return SupportChatStaffNames.DisplayNameFa;

        return nameMap.GetValueOrDefault(message.SenderUserId) ?? $"User #{message.SenderUserId}";
    }

    public Task<bool> HasConversationWithSubjectAsync(
        long studentUserId,
        long teacherUserId,
        string subject,
        long? excludeConversationId = null,
        CancellationToken cancellationToken = default)
    {
        var normalized = subject.Trim().ToLowerInvariant();
        if (normalized.Length < 3) return Task.FromResult(false);

        return commandDb.SupportConversations.AsNoTracking()
            .AnyAsync(x =>
                !x.IsDelete &&
                x.StudentUserId == studentUserId &&
                x.TeacherUserId == teacherUserId &&
                x.Subject.ToLower() == normalized &&
                (excludeConversationId == null || x.Id != excludeConversationId.Value),
                cancellationToken);
    }

    private async Task<Dictionary<long, StudentSupportTeacherQri>> BuildTeacherMapAsync(
        long studentUserId,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<long, StudentSupportTeacherQri>();
        var user = await commandDb.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == studentUserId, cancellationToken);
        if (user == null) return result;

        void Add(long teacherUserId, string name, string? email, string source)
        {
            if (teacherUserId <= 0 || teacherUserId == studentUserId || result.ContainsKey(teacherUserId)) return;
            result[teacherUserId] = new StudentSupportTeacherQri
            {
                TeacherUserId = teacherUserId,
                DisplayName = string.IsNullOrWhiteSpace(name) ? $"Teacher #{teacherUserId}" : name,
                Email = email,
                Source = source,
            };
        }

        var enrolledTeachers = await (
            from e in commandDb.Set<Enrollment>().AsNoTracking()
            join s in commandDb.Students.AsNoTracking() on e.StudentId equals s.Id
            join c in commandDb.Courses.AsNoTracking() on e.CourseId equals c.Id
            join t in commandDb.Teachers.AsNoTracking() on c.TeacherId equals t.Id
            join tu in commandDb.Users.AsNoTracking() on t.UserId equals tu.Id
            where s.UserId == studentUserId && e.IsActive && t.UserId != null
            select new
            {
                TeacherUserId = tu.Id,
                Name = tu.UserFullName == null
                    ? tu.UserNameValue
                    : (tu.UserFullName.FirstName + " " + tu.UserFullName.LastName).Trim(),
                Email = tu.EmailValue,
            }).Distinct().ToListAsync(cancellationToken);

        foreach (var row in enrolledTeachers)
            Add(row.TeacherUserId, row.Name, row.Email, "course");

        var userName = user.UserNameValue.Trim();
        var email = user.EmailValue?.Trim() ?? string.Empty;

        var managedIds = new HashSet<long>();

        if (!string.IsNullOrEmpty(userName))
        {
            var userNameVo = new UserName(userName);
            var idsByUserName = await commandDb.ManagedRoomStudents.AsNoTracking()
                .Where(s => !s.IsDelete && s.UserName == userNameVo)
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);
            foreach (var id in idsByUserName)
                managedIds.Add(id);
        }

        if (!string.IsNullOrEmpty(email))
        {
            var emailLower = email.ToLowerInvariant();
            var idsByEmail = await commandDb.ManagedRoomStudents.AsNoTracking()
                .Where(s => !s.IsDelete && s.Email != null && s.Email.ToLower() == emailLower)
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);
            foreach (var id in idsByEmail)
                managedIds.Add(id);
        }

        if (!string.IsNullOrEmpty(userName))
        {
            var userNameVo = new UserName(userName);
            var seatIdsByUserName = await commandDb.Set<RoomUser>().AsNoTracking()
                .Where(ru => ru.ManagedRoomStudentId != null && ru.UserName == userNameVo)
                .Select(ru => ru.ManagedRoomStudentId!.Value)
                .ToListAsync(cancellationToken);
            foreach (var id in seatIdsByUserName)
                managedIds.Add(id);
        }

        if (!string.IsNullOrEmpty(email))
        {
            var emailLower = email.ToLowerInvariant();
            var seatIdsByEmail = await commandDb.Set<RoomUser>().AsNoTracking()
                .Where(ru => ru.ManagedRoomStudentId != null && ru.Email != null && ru.Email.ToLower() == emailLower)
                .Select(ru => ru.ManagedRoomStudentId!.Value)
                .ToListAsync(cancellationToken);
            foreach (var id in seatIdsByEmail)
                managedIds.Add(id);
        }

        if (managedIds.Count > 0)
        {
            var planOwners = await (
                from plan in commandDb.EducationPlans.AsNoTracking()
                where !plan.IsDelete && managedIds.Contains(plan.ManagedRoomStudentId)
                join owner in commandDb.Users.AsNoTracking() on plan.OwnerUserId equals owner.Id
                select new
                {
                    TeacherUserId = owner.Id,
                    Name = owner.UserFullName == null
                        ? owner.UserNameValue
                        : (owner.UserFullName.FirstName + " " + owner.UserFullName.LastName).Trim(),
                    Email = owner.EmailValue,
                }).Distinct().ToListAsync(cancellationToken);

            foreach (var row in planOwners)
                Add(row.TeacherUserId, row.Name, row.Email, "education_plan");
        }

        var directoryTeachers = await (
            from t in commandDb.Teachers.AsNoTracking()
            join u in commandDb.Users.AsNoTracking() on t.UserId equals u.Id
            where !t.IsDelete && t.UserId != null && t.UserId > 0
            select new
            {
                TeacherUserId = u.Id,
                Name = u.UserFullName == null
                    ? u.UserNameValue
                    : (u.UserFullName.FirstName + " " + u.UserFullName.LastName).Trim(),
                Email = u.EmailValue,
            }).Distinct().ToListAsync(cancellationToken);

        foreach (var row in directoryTeachers)
            Add(row.TeacherUserId, row.Name, row.Email, "teacher");

        return result;
    }

    public Task<bool> HasRatingAsync(long conversationId, CancellationToken cancellationToken = default)
    {
        return commandDb.SupportConversationRatings.AsNoTracking()
            .AnyAsync(x => x.ConversationId == conversationId, cancellationToken);
    }

    public async Task<Dictionary<long, (int TotalPoints, int Count)>> GetTeacherRatingAggregatesAsync(
        IReadOnlyList<long> teacherUserIds,
        CancellationToken cancellationToken = default)
    {
        if (teacherUserIds.Count == 0) return [];

        var ids = teacherUserIds.Distinct().ToList();
        var rows = await commandDb.SupportConversationRatings.AsNoTracking()
            .Where(x => ids.Contains(x.TeacherUserId))
            .GroupBy(x => x.TeacherUserId)
            .Select(g => new { TeacherUserId = g.Key, TotalPoints = g.Sum(x => x.ScorePoints), Count = g.Count() })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(x => x.TeacherUserId, x => (x.TotalPoints, x.Count));
    }

    public async Task<List<TeacherStoryQri>> GetActiveTeacherStoriesAsync(
        long userId,
        bool isAdmin = false,
        CancellationToken cancellationToken = default)
    {
        var teacherIds = new HashSet<long>();

        if (isAdmin)
        {
            var nowAdmin = DateTime.UtcNow;
            var adminStories = await commandDb.SupportTeacherStories.AsNoTracking()
                .Where(x => !x.IsDelete && x.ExpiresAtUtc > nowAdmin)
                .OrderByDescending(x => x.CreatedAtUtc)
                .ToListAsync(cancellationToken);
            return await MapStoriesAsync(adminStories, userId, cancellationToken);
        }

        var studentTeachers = await GetStudentTeachersAsync(userId, cancellationToken);
        foreach (var teacher in studentTeachers)
            teacherIds.Add(teacher.TeacherUserId);

        var isConversationTeacher = await commandDb.SupportConversations.AsNoTracking()
            .AnyAsync(x => !x.IsDelete && x.TeacherUserId == userId, cancellationToken);
        if (isConversationTeacher)
            teacherIds.Add(userId);

        var isCatalogTeacher = await commandDb.Teachers.AsNoTracking()
            .AnyAsync(t => t.UserId == userId && !t.IsDelete, cancellationToken);
        if (isCatalogTeacher)
            teacherIds.Add(userId);

        if (teacherIds.Count == 0)
            return [];

        var now = DateTime.UtcNow;
        var stories = await commandDb.SupportTeacherStories.AsNoTracking()
            .Where(x => !x.IsDelete && teacherIds.Contains(x.TeacherUserId) && x.ExpiresAtUtc > now)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return await MapStoriesAsync(stories, userId, cancellationToken);
    }

    private async Task<List<TeacherStoryQri>> MapStoriesAsync(
        List<SupportTeacherStory> stories,
        long viewerUserId,
        CancellationToken cancellationToken)
    {
        if (stories.Count == 0)
            return [];

        var storyIds = stories.Select(x => x.Id).ToList();
        var viewedIds = await commandDb.SupportTeacherStoryViews.AsNoTracking()
            .Where(v => v.ViewerUserId == viewerUserId && storyIds.Contains(v.StoryId))
            .Select(v => v.StoryId)
            .ToListAsync(cancellationToken);
        var viewedSet = viewedIds.ToHashSet();

        var teacherUserIds = stories.Select(x => x.TeacherUserId).Distinct().ToList();
        var users = await commandDb.Users.AsNoTracking()
            .Where(u => teacherUserIds.Contains(u.Id))
            .ToListAsync(cancellationToken);
        var nameMap = users.ToDictionary(u => u.Id, BuildUserDisplayName);
        var avatarMap = users.ToDictionary(
            u => u.Id,
            u => u.ProfileImage?.ImageURL);

        return stories.Select(s => new TeacherStoryQri
        {
            Id = s.Id,
            TeacherUserId = s.TeacherUserId,
            TeacherName = nameMap.GetValueOrDefault(s.TeacherUserId, "استاد"),
            TeacherAvatarUrl = avatarMap.GetValueOrDefault(s.TeacherUserId),
            Caption = s.Caption,
            MediaUrl = s.MediaUrl,
            ThumbnailUrl = s.ThumbnailUrl,
            MediaKind = (int)s.MediaKind,
            DurationSeconds = s.DurationSeconds > 0 ? s.DurationSeconds : 5,
            HasUnseen = !viewedSet.Contains(s.Id),
            CreatedAtUtc = s.CreatedAtUtc,
            ExpiresAtUtc = s.ExpiresAtUtc,
        }).ToList();
    }

    public async Task<List<DesktopOnlineUserQri>> GetOnlineDesktopUsersAsync(
        int take = 200,
        CancellationToken cancellationToken = default)
    {
        take = take is > 0 and <= 500 ? take : 200;
        var cutoff = DateTime.UtcNow.AddMinutes(-3);
        var rows = await commandDb.DesktopUserPresences.AsNoTracking()
            .Where(x => !x.IsDelete && x.Status == "Online" && x.LastSeenAtUtc >= cutoff)
            .OrderByDescending(x => x.LastSeenAtUtc)
            .Take(take)
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
            return [];

        var userIds = rows.Select(x => x.UserId).Distinct().ToList();
        var users = await commandDb.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync(cancellationToken);
        var nameMap = users.ToDictionary(u => u.Id, BuildUserDisplayName);

        return rows.Select(r => new DesktopOnlineUserQri
        {
            UserId = r.UserId,
            DisplayName = nameMap.GetValueOrDefault(r.UserId, $"User #{r.UserId}"),
            Status = r.Status,
            AppVersion = r.AppVersion,
            DeviceId = r.DeviceId,
            LastSeenAtUtc = r.LastSeenAtUtc,
        }).ToList();
    }

    public async Task<string?> GetDesktopPresenceStatusAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var row = await commandDb.DesktopUserPresences.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && !x.IsDelete, cancellationToken);
        if (row is null) return null;
        // Stale heartbeats should not count as online.
        if (row.Status == "Online" && row.LastSeenAtUtc < DateTime.UtcNow.AddMinutes(-3))
            return "Offline";
        return row.Status;
    }

    private static string BuildUserDisplayName(User user)
    {
        if (user.UserFullName != null)
        {
            var full = $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim();
            if (!string.IsNullOrWhiteSpace(full)) return full;
        }
        return user.UserNameValue;
    }

    private static string StripHtml(string html, int maxLen)
    {
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ").Trim();
        if (text.Length <= maxLen) return text;
        return text[..maxLen] + "...";
    }
}
