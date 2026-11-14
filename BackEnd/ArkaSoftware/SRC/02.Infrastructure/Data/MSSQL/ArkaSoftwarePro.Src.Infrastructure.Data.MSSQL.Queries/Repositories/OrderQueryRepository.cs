using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetMyOrders;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class OrderQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IOrderQueryRepository
    {
        public async Task<List<GetMyOrdersQri>> GetMyOrdersAsync(GetMyOrdersQuery query)
        {
            var orders = await _dbContext.Orders
                .AsNoTracking()
                .Include(x => x.OrderItems)
                .Include(x => x.Student)
                .ThenInclude(x => x.User)
                .Where(x => x.Student!.User!.Id == query.UserId)
                .OrderByDescending(x => x.CreateDateTime)
                .ToListAsync();

            return orders.Select(x => new GetMyOrdersQri
            {
                Id = x.OrderId,
                OrderDate = x.CreateDateTime.ToString("yyyy/MM/dd"),
                TotalAmount = x.OrderItems.Sum(i => (i.UnitPrice) * i.Quantity),
                Status = x.OrderStatus.ToString(),
                Items = x.OrderItems.Select(i => $"Course #{i.CourseId}").ToList()
            }).ToList();
        }

        public async Task<GetOrderByIdQri?> GetOrderByIdAsync(GetOrderByIdQuery query)
        {
            var order = await _dbContext.Orders
                .AsNoTracking()
                .Include(x => x.OrderItems)
                .ThenInclude(i => i.Course)
                .Include(x => x.Student)
                .FirstOrDefaultAsync(x => x.OrderId == query.OrderId);

            if (order == null)
                return null;

            return new GetOrderByIdQri
            {
                Id = order.OrderId,
                StudentId = order.StudentId,
                Status = order.OrderStatus.ToString(),
                OrderDate = order.CreateDateTime.ToString("yyyy/MM/dd"),
                OrderItems = order.OrderItems.Select(i => new OrderItemQri
                {
                    CourseId = i.CourseId,
                    CourseTitle = i.Course?.Title ?? "",
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    TotalPrice = i.UnitPrice * i.Quantity
                }).ToList()
            };
        }
    }
}
