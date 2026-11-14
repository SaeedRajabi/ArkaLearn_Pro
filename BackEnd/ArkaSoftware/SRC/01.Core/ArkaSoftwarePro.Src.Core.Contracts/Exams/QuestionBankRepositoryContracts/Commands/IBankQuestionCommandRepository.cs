using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Exams.QuestionBankRepositoryContracts.Commands;

public interface IBankQuestionCommandRepository : ICommandRepository<BankQuestion, long>
{
    Task<BankQuestion?> GetByIdWithOptionsAsync(long id);
    Task<BankQuestion?> FindActiveByContentHashAsync(string contentHash);
    Task<List<BankQuestion>> GetByIdsWithOptionsAsync(IEnumerable<long> ids);
}
