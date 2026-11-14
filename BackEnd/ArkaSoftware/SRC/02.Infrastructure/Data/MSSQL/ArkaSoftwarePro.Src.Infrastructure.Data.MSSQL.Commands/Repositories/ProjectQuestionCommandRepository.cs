using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class ProjectQuestionCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<ProjectQuestion, ArkaSoftwareCommandDbContext>(dbContext), IProjectQuestionCommandRepository
{
    public async Task<ProjectQuestion?> GetWithAnswersAsync(long questionId)
    {
        return await _dbContext.ProjectQuestions
            .Include(x => x.Answers)
            .FirstOrDefaultAsync(x => x.Id == questionId && !x.IsDelete);
    }

    public async Task<ProjectAnswer?> GetAnswerAsync(long answerId)
    {
        return await _dbContext.Set<ProjectAnswer>()
            .FirstOrDefaultAsync(x => x.Id == answerId && !x.IsDelete);
    }

    public async Task<bool> HasUserLikedAnswerAsync(long answerId, long userId)
    {
        return await _dbContext.Set<ProjectAnswerLike>()
            .AnyAsync(x => x.AnswerId == answerId && x.UserId == userId && !x.IsDelete);
    }

    public async Task AddAnswerLikeAsync(ProjectAnswerLike like)
    {
        await _dbContext.Set<ProjectAnswerLike>().AddAsync(like);
    }

    public async Task RemoveAnswerLikeAsync(long answerId, long userId)
    {
        var like = await _dbContext.Set<ProjectAnswerLike>()
            .FirstOrDefaultAsync(x => x.AnswerId == answerId && x.UserId == userId && !x.IsDelete);
        if (like != null)
            _dbContext.Set<ProjectAnswerLike>().Remove(like);
    }

    public async Task<List<long>> GetAdminUserIdsAsync()
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.Role == UserRole.ADMIN && !x.IsDelete)
            .Select(x => x.Id)
            .ToListAsync();
    }
}
