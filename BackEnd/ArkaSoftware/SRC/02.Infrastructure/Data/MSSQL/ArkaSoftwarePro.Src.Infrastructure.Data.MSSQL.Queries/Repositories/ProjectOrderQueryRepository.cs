using ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrderById;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrders;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetProjectOrderById;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.SearchProjectOrders;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Framework.Src.Utilities.OutService.DateTimes;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class ProjectOrderQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IProjectOrderQueriesRepository
{
    public async Task<List<MyProjectOrderQri>> GetMyProjectOrdersAsync(long userId)
    {
        return await _dbContext.ProjectOrders
            .AsNoTracking()
            .Where(x => !x.IsDelete && x.UserId == userId)
            .OrderByDescending(x => x.CreatedDateTime)
            .Select(x => new MyProjectOrderQri
            {
                Id = x.Id,
                RequestNumber = x.RequestNumber,
                Title = x.Title,
                Status = x.Status.ToString(),
                AdminNote = x.AdminNote,
                CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                ReviewedAt = x.ReviewedAt.HasValue
                    ? x.ReviewedAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                    : null,
            })
            .ToListAsync();
    }

    public async Task<ProjectOrderQri?> GetMyProjectOrderByIdAsync(GetMyProjectOrderByIdQuery query)
    {
        var row = await _dbContext.ProjectOrders
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.ReviewedByUser)
            .FirstOrDefaultAsync(x => !x.IsDelete && x.Id == query.OrderId && x.UserId == query.UserId);

        return row == null ? null : MapToQri(row);
    }

    public async Task<ProjectOrderQri?> GetProjectOrderByIdAsync(GetProjectOrderByIdQuery query)
    {
        var row = await _dbContext.ProjectOrders
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.ReviewedByUser)
            .FirstOrDefaultAsync(x => !x.IsDelete && x.Id == query.OrderId);

        return row == null ? null : MapToQri(row);
    }

    public async Task<PagedData<SearchProjectOrderQri>?> SearchProjectOrdersAsync(SearchProjectOrdersQuery query)
    {
        var q = _dbContext.ProjectOrders
            .AsNoTracking()
            .Include(x => x.User)
            .Where(x => !x.IsDelete);

        if (!string.IsNullOrWhiteSpace(query.InputValue))
        {
            var input = query.InputValue.Trim();
            q = q.Where(x =>
                x.Title.Contains(input) ||
                x.FirstName.Contains(input) ||
                x.LastName.Contains(input) ||
                x.Phone.Contains(input) ||
                x.RequestNumber.ToString() == input ||
                (x.User != null && (
                    (x.User.FirstName != null && x.User.FirstName.Contains(input)) ||
                    (x.User.LastName != null && x.User.LastName.Contains(input)) ||
                    (x.User.Email != null && x.User.Email.Contains(input)) ||
                    (x.User.UserName != null && x.User.UserName.Contains(input)))));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) &&
            Enum.TryParse<ProjectOrderStatus>(query.Status, true, out var status))
        {
            q = q.Where(x => x.Status == status);
        }

        var ordered = q.OrderByDescending(x => x.CreatedDateTime);
        var result = new PagedData<SearchProjectOrderQri>();
        if (query.NeedTotalCount)
            result.TotalCount = await ordered.CountAsync();

        var rows = await ordered
            .Skip(query.SkipCount)
            .Take(query.PageSize)
            .ToListAsync();

        result.QueryResult = rows.Select(x => new SearchProjectOrderQri
        {
            Id = x.Id,
            RequestNumber = x.RequestNumber,
            Title = x.Title,
            ProjectType = x.ProjectType,
            Status = x.Status.ToString(),
            RequesterName = ResolveRequesterName(x),
            RequesterEmail = x.User?.Email,
            RequesterPhone = ResolveRequesterPhone(x),
            CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
            ReviewedAt = x.ReviewedAt.HasValue
                ? x.ReviewedAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                : null,
        }).ToList();

        return result;
    }

    public async Task<int> GetPendingCountAsync()
    {
        return await _dbContext.ProjectOrders
            .AsNoTracking()
            .CountAsync(x => !x.IsDelete && x.Status == ProjectOrderStatus.Submitted);
    }

    private static ProjectOrderQri MapToQri(Entities.ProjectOrders.ProjectOrderQueryModel row) =>
        new()
        {
            Id = row.Id,
            RequestNumber = row.RequestNumber,
            UserId = row.UserId,
            RequesterName = ResolveRequesterName(row),
            RequesterEmail = row.User?.Email,
            RequesterPhone = ResolveRequesterPhone(row),
            RequesterAvatarUrl = row.User?.ProfileImage,
            Title = row.Title,
            ProjectType = row.ProjectType,
            DescriptionHtml = row.DescriptionHtml ?? string.Empty,
            Status = row.Status.ToString(),
            AdminNote = row.AdminNote,
            ReviewedByUserId = row.ReviewedByUserId,
            ReviewedByName = BuildDisplayName(row.ReviewedByUser),
            CreatedAt = row.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
            ReviewedAt = row.ReviewedAt.HasValue
                ? row.ReviewedAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                : null,
        };

    private static string? BuildDisplayName(Entities.Users.UserQueryModel? user)
    {
        if (user == null)
            return null;

        var full = $"{user.FirstName?.Trim() ?? ""} {user.LastName?.Trim() ?? ""}".Trim();
        if (!string.IsNullOrEmpty(full))
            return full;
        if (!string.IsNullOrWhiteSpace(user.UserName))
            return user.UserName.Trim();
        return user.Email?.Trim();
    }

    private static string? ResolveRequesterName(Entities.ProjectOrders.ProjectOrderQueryModel row)
    {
        var fromUser = BuildDisplayName(row.User);
        if (!string.IsNullOrWhiteSpace(fromUser))
            return fromUser;

        var guest = $"{row.FirstName} {row.LastName}".Trim();
        return string.IsNullOrWhiteSpace(guest) ? null : guest;
    }

    private static string? ResolveRequesterPhone(Entities.ProjectOrders.ProjectOrderQueryModel row)
    {
        if (!string.IsNullOrWhiteSpace(row.Phone))
            return row.Phone.Trim();
        return null;
    }
}
