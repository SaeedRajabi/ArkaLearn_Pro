using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionById;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionsByProjectId;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchProjectQuestions;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Framework.Src.Utilities.OutService.DateTimes;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class ProjectQuestionQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IProjectQuestionQueriesRepository
{
    public async Task<List<ProjectQuestionQri>> GetByProjectIdAsync(GetProjectQuestionsByProjectIdQuery query)
    {
        var rows = await _dbContext.ProjectQuestions
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Answers).ThenInclude(a => a.User)
            .Where(x => !x.IsDelete && x.ProjectId == query.ProjectId && x.Status == ProjectQuestionStatus.Approved)
            .OrderByDescending(x => x.CreatedDateTime)
            .ToListAsync();

        var answerIds = rows.SelectMany(x => x.Answers).Select(a => a.Id).ToList();
        var likedIds = new HashSet<long>();
        if (query.CurrentUserId > 0 && answerIds.Count > 0)
        {
            likedIds = (await _dbContext.ProjectAnswerLikes
                .AsNoTracking()
                .Where(l => !l.IsDelete && l.UserId == query.CurrentUserId && answerIds.Contains(l.AnswerId))
                .Select(l => l.AnswerId)
                .ToListAsync()).ToHashSet();
        }

        return rows.Select(x => MapQuestion(x, likedIds)).ToList();
    }

    public async Task<ProjectQuestionDetailQri?> GetByIdAsync(GetProjectQuestionByIdQuery query)
    {
        var row = await _dbContext.ProjectQuestions
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.ReviewedByUser)
            .Include(x => x.Answers).ThenInclude(a => a.User)
            .FirstOrDefaultAsync(x => !x.IsDelete && x.Id == query.QuestionId);

        if (row == null) return null;

        var project = await _dbContext.Projects.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == row.ProjectId);

        var likedIds = new HashSet<long>();
        var mapped = MapQuestion(row, likedIds);
        return new ProjectQuestionDetailQri
        {
            Id = mapped.Id,
            ProjectId = mapped.ProjectId,
            UserId = mapped.UserId,
            Subject = mapped.Subject,
            ContentHtml = mapped.ContentHtml,
            AudioUrl = mapped.AudioUrl,
            Status = mapped.Status,
            AuthorName = mapped.AuthorName,
            AuthorAvatarUrl = mapped.AuthorAvatarUrl,
            CreatedAt = mapped.CreatedAt,
            Answers = mapped.Answers,
            ProjectTitle = project?.Title,
            AuthorEmail = row.User?.Email,
            ReviewedByName = BuildDisplayName(row.ReviewedByUser),
            ReviewedAt = row.ReviewedAt.HasValue
                ? row.ReviewedAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                : null,
        };
    }

    public async Task<PagedData<SearchProjectQuestionQri>?> SearchAsync(SearchProjectQuestionsQuery query)
    {
        var q = _dbContext.ProjectQuestions.AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Answers)
            .Where(x => !x.IsDelete);

        if (query.ProjectId > 0)
            q = q.Where(x => x.ProjectId == query.ProjectId);

        if (query.SubmitterUserId is > 0)
            q = q.Where(x => x.UserId == query.SubmitterUserId);

        if (!string.IsNullOrWhiteSpace(query.Status) &&
            Enum.TryParse<ProjectQuestionStatus>(query.Status, true, out var status))
            q = q.Where(x => x.Status == status);

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

        var ordered = q.OrderByDescending(x => x.CreatedDateTime);
        var result = new PagedData<SearchProjectQuestionQri>();
        if (query.NeedTotalCount)
            result.TotalCount = await ordered.CountAsync();

        var rows = await ordered.Skip(query.SkipCount).Take(query.PageSize).ToListAsync();
        var projectIds = rows.Select(x => x.ProjectId).Distinct().ToList();
        var projects = await _dbContext.Projects.AsNoTracking()
            .Where(p => projectIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Title ?? "");

        result.QueryResult = rows.Select(x => new SearchProjectQuestionQri
        {
            Id = x.Id,
            ProjectId = x.ProjectId,
            ProjectTitle = projects.GetValueOrDefault(x.ProjectId),
            Subject = x.Subject,
            Status = x.Status.ToString(),
            AuthorName = BuildDisplayName(x.User),
            AnswerCount = x.Answers.Count(a => !a.IsDelete),
            CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
        }).ToList();

        return result;
    }

    public async Task<int> GetPendingCountAsync()
    {
        return await _dbContext.ProjectQuestions.AsNoTracking()
            .CountAsync(x => !x.IsDelete && x.Status == ProjectQuestionStatus.Pending);
    }

    private static ProjectQuestionQri MapQuestion(
        Entities.ProjectQuestions.ProjectQuestionQueryModel row,
        HashSet<long> likedAnswerIds)
    {
        var answers = row.Answers
            .Where(a => !a.IsDelete)
            .OrderByDescending(a => a.LikeCount)
            .ThenByDescending(a => a.CreatedDateTime)
            .ToList();

        var maxLikes = answers.Count > 0 ? answers[0].LikeCount : 0;

        return new ProjectQuestionQri
        {
            Id = row.Id,
            ProjectId = row.ProjectId,
            UserId = row.UserId,
            Subject = row.Subject,
            ContentHtml = row.ContentHtml,
            AudioUrl = row.AudioUrl,
            Status = row.Status.ToString(),
            AuthorName = BuildDisplayName(row.User),
            AuthorAvatarUrl = row.User?.ProfileImage,
            CreatedAt = row.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
            Answers = answers.Select(a => new ProjectAnswerQri
            {
                Id = a.Id,
                UserId = a.UserId,
                ContentHtml = a.ContentHtml,
                AudioUrl = a.AudioUrl,
                LikeCount = a.LikeCount,
                LikedByCurrentUser = likedAnswerIds.Contains(a.Id),
                IsBestAnswer = maxLikes > 0 && a.LikeCount == maxLikes,
                AuthorName = BuildDisplayName(a.User),
                AuthorAvatarUrl = a.User?.ProfileImage,
                CreatedAt = a.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
            }).ToList(),
        };
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
