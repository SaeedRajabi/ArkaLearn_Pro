using ArkaSoftwarePro.Src.Core.Contracts.Exams.QuestionBankRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionAnalytics;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionById;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.SearchBankQuestions;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class BankQuestionQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IBankQuestionQueriesRepository
{
    public async Task<PagedData<BankQuestionListItemQri>> SearchAsync(SearchBankQuestionsQuery query)
    {
        var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 100);

        var q = _dbContext.BankQuestions.AsNoTracking().Where(x => x.IsActive);

        if (query.MineOnly)
        {
            q = query.ActorTeacherId.HasValue
                ? q.Where(x => x.OwnerUserId == query.ActorUserId || x.OwnerTeacherId == query.ActorTeacherId)
                : q.Where(x => x.OwnerUserId == query.ActorUserId);
        }

        if (!string.IsNullOrWhiteSpace(query.InputValue))
        {
            var term = query.InputValue.Trim();
            q = q.Where(x =>
                x.Prompt.Contains(term)
                || (x.Category != null && x.Category.Contains(term))
                || (x.Topic != null && x.Topic.Contains(term))
                || (x.Tags != null && x.Tags.Contains(term)));
        }

        if (query.QuestionType.HasValue)
            q = q.Where(x => x.QuestionType == query.QuestionType.Value);

        if (query.CourseId is > 0)
            q = q.Where(x => x.CourseId == query.CourseId);

        if (!string.IsNullOrWhiteSpace(query.Category))
            q = q.Where(x => x.Category == query.Category);

        if (!string.IsNullOrWhiteSpace(query.Topic))
            q = q.Where(x => x.Topic == query.Topic);

        if (query.Difficulty.HasValue)
        {
            var d = query.Difficulty.Value;
            q = q.Where(x =>
                (x.ManualDifficulty.HasValue && x.ManualDifficulty == d)
                || (!x.ManualDifficulty.HasValue && x.ComputedDifficulty == d));
        }

        var total = await q.CountAsync();
        var rows = await (
            from b in q
            join c in _dbContext.Courses.AsNoTracking() on b.CourseId equals c.CourseId into courseJoin
            from c in courseJoin.DefaultIfEmpty()
            orderby b.CreatedDateTime descending
            select new BankQuestionListItemQri
            {
                Id = b.Id,
                QuestionType = b.QuestionType,
                Prompt = b.Prompt,
                Category = b.Category,
                Topic = b.Topic,
                Tags = b.Tags,
                CourseId = b.CourseId,
                CourseTitle = c != null ? c.Title : null,
                DefaultPoints = b.DefaultPoints,
                ManualDifficulty = b.ManualDifficulty,
                ComputedDifficulty = b.ComputedDifficulty,
                EffectiveDifficulty = b.ManualDifficulty ?? b.ComputedDifficulty,
                CorrectRate = b.CorrectRate,
                TotalGradedAnswers = b.TotalGradedAnswers,
                CorrectAnswers = b.CorrectAnswers,
                UsageCount = b.UsageCount,
                OwnerUserId = b.OwnerUserId,
                CreatedAt = b.CreatedDateTime,
            })
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedData<BankQuestionListItemQri>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total,
            QueryResult = rows,
        };
    }

    public async Task<BankQuestionDetailQri?> GetByIdAsync(long id, bool includeCorrectAnswers)
    {
        var b = await _dbContext.BankQuestions.AsNoTracking()
            .Include(x => x.Options)
            .FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
        if (b == null) return null;

        string? courseTitle = null;
        if (b.CourseId.HasValue)
        {
            courseTitle = await _dbContext.Courses.AsNoTracking()
                .Where(c => c.CourseId == b.CourseId.Value)
                .Select(c => c.Title)
                .FirstOrDefaultAsync();
        }

        return new BankQuestionDetailQri
        {
            Id = b.Id,
            QuestionType = b.QuestionType,
            Prompt = b.Prompt,
            CodeSnippet = b.CodeSnippet,
            CodeLanguage = b.CodeLanguage,
            DefaultPoints = b.DefaultPoints,
            Category = b.Category,
            Topic = b.Topic,
            Tags = b.Tags,
            CourseId = b.CourseId,
            CourseTitle = courseTitle,
            ManualDifficulty = b.ManualDifficulty,
            ComputedDifficulty = b.ComputedDifficulty,
            EffectiveDifficulty = b.ManualDifficulty ?? b.ComputedDifficulty,
            CorrectRate = b.CorrectRate,
            TotalGradedAnswers = b.TotalGradedAnswers,
            CorrectAnswers = b.CorrectAnswers,
            UsageCount = b.UsageCount,
            OwnerUserId = b.OwnerUserId,
            OwnerTeacherId = b.OwnerTeacherId,
            CreatedAt = b.CreatedDateTime,
            Options = b.Options
                .OrderBy(o => o.OrderIndex)
                .Select(o => new BankQuestionOptionQri
                {
                    Id = o.Id,
                    Text = o.Text,
                    IsCorrect = includeCorrectAnswers && o.IsCorrect,
                    OrderIndex = o.OrderIndex,
                })
                .ToList(),
        };
    }

    public async Task<BankQuestionAnalyticsQri> GetAnalyticsAsync(long actorUserId, long? ownerTeacherId, bool isAdmin)
    {
        var q = _dbContext.BankQuestions.AsNoTracking().Where(x => x.IsActive);
        if (!isAdmin)
        {
            q = ownerTeacherId.HasValue
                ? q.Where(x => x.OwnerUserId == actorUserId || x.OwnerTeacherId == ownerTeacherId)
                : q.Where(x => x.OwnerUserId == actorUserId);
        }

        var list = await q.Select(b => new
        {
            b.Id,
            b.Prompt,
            b.QuestionType,
            b.Category,
            Effective = b.ManualDifficulty ?? b.ComputedDifficulty,
            b.CorrectRate,
            b.TotalGradedAnswers,
            b.UsageCount,
        }).ToListAsync();

        var graded = list.Where(x => x.TotalGradedAnswers > 0).ToList();

        return new BankQuestionAnalyticsQri
        {
            TotalQuestions = list.Count,
            EasyCount = list.Count(x => x.Effective == (byte)QuestionDifficulty.Easy),
            MediumCount = list.Count(x => x.Effective == (byte)QuestionDifficulty.Medium),
            HardCount = list.Count(x => x.Effective == (byte)QuestionDifficulty.Hard),
            UnknownCount = list.Count(x => x.Effective == (byte)QuestionDifficulty.Unknown),
            MultipleChoiceCount = list.Count(x => x.QuestionType == (byte)ExamQuestionType.MultipleChoice),
            TrueFalseCount = list.Count(x => x.QuestionType == (byte)ExamQuestionType.TrueFalse),
            ShortAnswerCount = list.Count(x => x.QuestionType == (byte)ExamQuestionType.ShortAnswer),
            TotalUsages = list.Sum(x => x.UsageCount),
            TotalGradedAnswers = list.Sum(x => x.TotalGradedAnswers),
            AverageCorrectRate = graded.Count == 0
                ? 0
                : Math.Round(graded.Average(x => x.CorrectRate), 4),
            TopCategories = list
                .Where(x => !string.IsNullOrWhiteSpace(x.Category))
                .GroupBy(x => x.Category!)
                .Select(g => new BankCategoryStatQri { Category = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(8)
                .ToList(),
            HardestQuestions = graded
                .Where(x => x.TotalGradedAnswers >= 3)
                .OrderBy(x => x.CorrectRate)
                .Take(5)
                .Select(x => new BankQuestionListHotQri
                {
                    Id = x.Id,
                    Prompt = x.Prompt.Length > 120 ? x.Prompt[..120] + "…" : x.Prompt,
                    EffectiveDifficulty = x.Effective,
                    CorrectRate = x.CorrectRate,
                    TotalGradedAnswers = x.TotalGradedAnswers,
                })
                .ToList(),
            EasiestQuestions = graded
                .Where(x => x.TotalGradedAnswers >= 3)
                .OrderByDescending(x => x.CorrectRate)
                .Take(5)
                .Select(x => new BankQuestionListHotQri
                {
                    Id = x.Id,
                    Prompt = x.Prompt.Length > 120 ? x.Prompt[..120] + "…" : x.Prompt,
                    EffectiveDifficulty = x.Effective,
                    CorrectRate = x.CorrectRate,
                    TotalGradedAnswers = x.TotalGradedAnswers,
                })
                .ToList(),
        };
    }

    public async Task<BankQuestionDetailAnalyticsQri?> GetQuestionAnalyticsAsync(long id)
    {
        var b = await _dbContext.BankQuestions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
        if (b == null) return null;

        var linked = await (
            from eq in _dbContext.ExamQuestions.AsNoTracking()
            join e in _dbContext.Exams.AsNoTracking() on eq.ExamId equals e.Id
            where eq.BankQuestionId == id
            orderby e.CreatedDateTime descending
            select new BankQuestionExamUsageQri
            {
                ExamId = e.Id,
                ExamTitle = e.Title,
                CreatedAt = e.CreatedDateTime,
            })
            .Take(20)
            .ToListAsync();

        return new BankQuestionDetailAnalyticsQri
        {
            Id = b.Id,
            Prompt = b.Prompt,
            EffectiveDifficulty = b.ManualDifficulty ?? b.ComputedDifficulty,
            ManualDifficulty = b.ManualDifficulty,
            ComputedDifficulty = b.ComputedDifficulty,
            CorrectRate = b.CorrectRate,
            TotalGradedAnswers = b.TotalGradedAnswers,
            CorrectAnswers = b.CorrectAnswers,
            IncorrectAnswers = Math.Max(0, b.TotalGradedAnswers - b.CorrectAnswers),
            UsageCount = b.UsageCount,
            LinkedExamCount = linked.Count,
            RecentExams = linked,
        };
    }
}
