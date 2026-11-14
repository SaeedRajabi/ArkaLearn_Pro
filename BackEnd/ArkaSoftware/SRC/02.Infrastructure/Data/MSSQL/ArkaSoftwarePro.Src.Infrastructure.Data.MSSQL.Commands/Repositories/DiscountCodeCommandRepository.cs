using ArkaSoftwarePro.Src.Core.Contracts.Baskets.DiscountCodeRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class DiscountCodeCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<DiscountCode, ArkaSoftwareCommandDbContext>(dbContext),
      IDiscountCodeCommandRepository
{
    public async Task<DiscountCode?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var normalized = (code ?? string.Empty).Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
            return null;

        return await _dbContext.DiscountCodes
            .Include(x => x.CourseTargets)
            .FirstOrDefaultAsync(
                x => x.Discount != null &&
                     x.Discount.Code != null &&
                     x.Discount.Code.ToUpper() == normalized,
                cancellationToken);
    }

    public async Task<bool> ExistsByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var normalized = (code ?? string.Empty).Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
            return false;

        return await _dbContext.DiscountCodes.AnyAsync(
            x => x.Discount != null &&
                 x.Discount.Code != null &&
                 x.Discount.Code.ToUpper() == normalized,
            cancellationToken);
    }

    public async Task<(List<DiscountCode> Items, int TotalCount)> SearchAsync(
        string? inputValue,
        byte? scopeType,
        bool? isActive,
        long? teacherId,
        long? studentUserId,
        long? courseId,
        int pageNumber,
        int pageSize,
        bool needTotalCount,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var query = _dbContext.DiscountCodes
            .AsNoTracking()
            .Include(x => x.CourseTargets)
            .AsQueryable();

        var term = (inputValue ?? string.Empty).Trim();
        if (!string.IsNullOrWhiteSpace(term))
        {
            var upper = term.ToUpperInvariant();
            query = query.Where(x =>
                (x.Discount.Code != null && x.Discount.Code.ToUpper().Contains(upper)) ||
                (x.Title != null && x.Title.Contains(term)));
        }

        if (scopeType.HasValue)
            query = query.Where(x => x.ScopeType == (DiscountScopeType)scopeType.Value);

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        if (teacherId is > 0)
            query = query.Where(x => x.TeacherId == teacherId.Value);

        if (studentUserId is > 0)
            query = query.Where(x => x.StudentUserId == studentUserId.Value);

        if (courseId is > 0)
            query = query.Where(x => x.CourseTargets.Any(t => t.CourseId == courseId.Value));

        var total = 0;
        if (needTotalCount)
            total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
