using Framework.Src.Core.Contracts.Data.Commands;
using DiscountCodeEntity = ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities.DiscountCode;

namespace ArkaSoftwarePro.Src.Core.Contracts.Baskets.DiscountCodeRepositoryContracts.Commands;

public interface IDiscountCodeCommandRepository : ICommandRepository<DiscountCodeEntity, long>
{
    Task<DiscountCodeEntity?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<bool> ExistsByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<(List<DiscountCodeEntity> Items, int TotalCount)> SearchAsync(
        string? inputValue,
        byte? scopeType,
        bool? isActive,
        long? teacherId,
        long? studentUserId,
        long? courseId,
        int pageNumber,
        int pageSize,
        bool needTotalCount,
        CancellationToken cancellationToken = default);
}
