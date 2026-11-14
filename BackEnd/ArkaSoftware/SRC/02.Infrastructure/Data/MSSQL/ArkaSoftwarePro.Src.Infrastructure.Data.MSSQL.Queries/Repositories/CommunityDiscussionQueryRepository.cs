using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.GetCommunityThreadById;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchCommunityThreads;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Framework.Src.Utilities.OutService.DateTimes;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class CommunityDiscussionQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ICommunityDiscussionQueriesRepository
{
    public async Task<PagedData<SearchCommunityThreadQri>?> SearchAsync(SearchCommunityThreadsQuery query)
    {
        var q = _dbContext.CommunityThreads.AsNoTracking()
            .Include(x => x.User)
            .Where(x => !x.IsDelete);

        if (query.AuthorUserId is > 0)
            q = q.Where(x => x.UserId == query.AuthorUserId);

        if (!string.IsNullOrWhiteSpace(query.InputValue))
        {
            var input = query.InputValue.Trim();
            q = q.Where(x =>
                (x.Subject != null && x.Subject.Contains(input)) ||
                x.ContentHtml.Contains(input) ||
                (x.User != null && (
                    (x.User.FirstName != null && x.User.FirstName.Contains(input)) ||
                    (x.User.LastName != null && x.User.LastName.Contains(input)) ||
                    (x.User.Email != null && x.User.Email.Contains(input)))));
        }

        var sort = (query.SortBy ?? "newest").Trim().ToLowerInvariant();
        IOrderedQueryable<Entities.CommunityDiscussions.CommunityThreadQueryModel> ordered = sort switch
        {
            "mostreplies" => q.OrderByDescending(x => x.ReplyCount).ThenByDescending(x => x.CreatedDateTime),
            "mostliked" => q.OrderByDescending(x => x.LikeCount).ThenByDescending(x => x.CreatedDateTime),
            _ => q.OrderByDescending(x => x.CreatedDateTime),
        };

        var result = new PagedData<SearchCommunityThreadQri>();
        if (query.NeedTotalCount)
            result.TotalCount = await ordered.CountAsync();

        var rows = await ordered.Skip(query.SkipCount).Take(query.PageSize).ToListAsync();
        result.QueryResult = rows.Select(x => new SearchCommunityThreadQri
        {
            Id = x.Id,
            Subject = x.Subject,
            ContentPreview = BuildContentPreview(x.ContentHtml),
            AuthorName = BuildDisplayName(x.User),
            AuthorAvatarUrl = x.User?.ProfileImage,
            ReplyCount = x.ReplyCount,
            LikeCount = x.LikeCount,
            DislikeCount = x.DislikeCount,
            CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
        }).ToList();

        return result;
    }

    public async Task<CommunityThreadDetailQri?> GetByIdAsync(GetCommunityThreadByIdQuery query)
    {
        var row = await _dbContext.CommunityThreads.AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Replies).ThenInclude(r => r.User)
            .FirstOrDefaultAsync(x => !x.IsDelete && x.Id == query.ThreadId);

        if (row == null) return null;

        var replyIds = row.Replies.Where(r => !r.IsDelete).Select(r => r.Id).ToList();
        var likedReplyIds = new HashSet<long>();
        if (query.CurrentUserId > 0 && replyIds.Count > 0)
        {
            likedReplyIds = (await _dbContext.CommunityReplyLikes.AsNoTracking()
                .Where(l => !l.IsDelete && l.UserId == query.CurrentUserId && replyIds.Contains(l.ReplyId))
                .Select(l => l.ReplyId)
                .ToListAsync()).ToHashSet();
        }

        int? myReaction = null;
        var isSubscribed = false;
        if (query.CurrentUserId > 0)
        {
            myReaction = await _dbContext.CommunityThreadReactions.AsNoTracking()
                .Where(r => !r.IsDelete && r.ThreadId == query.ThreadId && r.UserId == query.CurrentUserId)
                .Select(r => (int?)r.Reaction)
                .FirstOrDefaultAsync();

            isSubscribed = await _dbContext.CommunityThreadSubscriptions.AsNoTracking()
                .AnyAsync(s => !s.IsDelete && s.ThreadId == query.ThreadId && s.UserId == query.CurrentUserId);
        }

        return new CommunityThreadDetailQri
        {
            Id = row.Id,
            UserId = row.UserId,
            Subject = row.Subject,
            ContentHtml = row.ContentHtml,
            AudioUrl = row.AudioUrl,
            Slug = row.Slug,
            ReplyCount = row.ReplyCount,
            LikeCount = row.LikeCount,
            DislikeCount = row.DislikeCount,
            MyReaction = myReaction ?? 0,
            IsSubscribed = isSubscribed,
            AuthorName = BuildDisplayName(row.User),
            AuthorAvatarUrl = row.User?.ProfileImage,
            CreatedAt = row.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
            Replies = row.Replies
                .Where(r => !r.IsDelete)
                .OrderBy(r => r.CreatedDateTime)
                .Select(r => new CommunityReplyQri
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    ContentHtml = r.ContentHtml,
                    AudioUrl = r.AudioUrl,
                    LikeCount = r.LikeCount,
                    LikedByCurrentUser = likedReplyIds.Contains(r.Id),
                    AuthorName = BuildDisplayName(r.User),
                    AuthorAvatarUrl = r.User?.ProfileImage,
                    CreatedAt = r.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                }).ToList(),
        };
    }

    private static string BuildContentPreview(string html, int maxLen = 160)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
        text = System.Text.RegularExpressions.Regex.Replace(text, "\\s+", " ").Trim();
        if (text.Length <= maxLen) return text;
        return text[..maxLen] + "...";
    }

    private static string? BuildDisplayName(Entities.Users.UserQueryModel? user)
    {
        if (user == null) return null;
        var full = $"{user.FirstName?.Trim() ?? ""} {user.LastName?.Trim() ?? ""}".Trim();
        if (!string.IsNullOrEmpty(full)) return full;
        if (!string.IsNullOrWhiteSpace(user.UserName)) return user.UserName.Trim();
        return user.Email?.Trim();
    }
}
