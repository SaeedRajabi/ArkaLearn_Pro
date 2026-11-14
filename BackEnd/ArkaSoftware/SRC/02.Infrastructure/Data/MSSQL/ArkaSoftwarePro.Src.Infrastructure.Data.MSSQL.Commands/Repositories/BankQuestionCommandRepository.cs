using ArkaSoftwarePro.Src.Core.Contracts.Exams.QuestionBankRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class BankQuestionCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<BankQuestion, ArkaSoftwareCommandDbContext>(dbContext), IBankQuestionCommandRepository
{
    public async Task<BankQuestion?> GetByIdWithOptionsAsync(long id)
    {
        return await _dbContext.BankQuestions
            .Include(x => x.Options)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);
    }

    public async Task<BankQuestion?> FindActiveByContentHashAsync(string contentHash)
    {
        if (string.IsNullOrWhiteSpace(contentHash))
            return null;

        return await _dbContext.BankQuestions
            .Include(x => x.Options)
            .FirstOrDefaultAsync(x =>
                x.ContentHash == contentHash
                && x.IsActive
                && !x.IsDelete);
    }

    public async Task<List<BankQuestion>> GetByIdsWithOptionsAsync(IEnumerable<long> ids)
    {
        var idList = ids.Distinct().Where(x => x > 0).ToList();
        if (idList.Count == 0)
            return [];

        return await _dbContext.BankQuestions
            .Include(x => x.Options)
            .Where(x => idList.Contains(x.Id) && x.IsActive && !x.IsDelete)
            .ToListAsync();
    }
}
