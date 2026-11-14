using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.AdminFinance;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetMyInvoices;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class InvoiceQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IInvoiceQueryRepository
    {
        public async Task<List<GetMyInvoicesQri>> GetMyInvoicesAsync(GetMyInvoicesQuery query)
        {
            var student = await _dbContext.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == query.UserId);

            if (student == null)
                return new List<GetMyInvoicesQri>();
            // StudentId in Invoice equals User.Id (1:1 Student-User)
            var invoices = await _dbContext.Invoices
                .AsNoTracking()
                .Where(i => i.StudentId == student!.StudentId)
                .OrderByDescending(i => i.InvoiceDate)
                .ToListAsync();

            var result = new List<GetMyInvoicesQri>();
            foreach (var inv in invoices)
            {
                var order = await _dbContext.Orders
                    .AsNoTracking()
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Course)
                    .FirstOrDefaultAsync(o => o.OrderId == inv.OrderId);
                var orderItemTitles = order?.OrderItems
                    .Select(x => new UserInvoiceOrderItems()
                    {
                        CourseTitle = x.Course?.Title ?? $"Course #{x.CourseId}",
                        Quantity = x.Quantity,
                        TotalPrice = x.UnitPrice * x.Quantity,
                        UnitPrice = x.UnitPrice

                    }).ToList();

                result.Add(new GetMyInvoicesQri
                {
                    Id = inv.Id,
                    InvoiceNumber = inv.InvoiceNumber,
                    InvoiceDate = inv.InvoiceDate.ToString("yyyy/MM/dd"),
                    TotalAmount = inv.TotalAmount,
                    PaidAmount = inv.PaidAmount,
                    RemainingAmount = inv.TotalAmount - inv.PaidAmount,
                    Status = ((ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations.InvoiceStatus)inv.Status).ToString(),
                    OrderId = inv.OrderId,
                    OrderItems = orderItemTitles ?? new List<UserInvoiceOrderItems>()
                });
            }
            return result;
        }

        public async Task<GetInvoiceByIdQri?> GetInvoiceByIdAsync(GetInvoiceByIdQuery query)
        {
            var inv = await _dbContext.Invoices
                .AsNoTracking()
                .Include(i => i.Transactions)
                .FirstOrDefaultAsync(i => i.Id == query.InvoiceId);

            if (inv == null)
                return null;

            var order = await _dbContext.Orders
                .AsNoTracking()
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Course)
                .FirstOrDefaultAsync(o => o.OrderId == inv.OrderId);

            var orderItems = order?.OrderItems.Select(oi => new InvoiceOrderItemQri
            {
                CourseId = oi.CourseId,
                CourseTitle = !string.IsNullOrWhiteSpace(oi.Course?.Title)
                    ? oi.Course!.Title
                    : $"Course #{oi.CourseId}",
                UnitPrice = oi.UnitPrice,
                Quantity = oi.Quantity,
                TotalPrice = oi.UnitPrice * oi.Quantity
            }).ToList() ?? new List<InvoiceOrderItemQri>();

            return new GetInvoiceByIdQri
            {
                Id = inv.Id,
                InvoiceNumber = inv.InvoiceNumber,
                InvoiceDate = inv.InvoiceDate.ToString("yyyy/MM/dd"),
                TotalAmount = inv.TotalAmount,
                PaidAmount = inv.PaidAmount,
                RemainingAmount = inv.TotalAmount - inv.PaidAmount,
                Status = ((ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations.InvoiceStatus)inv.Status).ToString(),
                Description = inv.Description,
                OrderId = inv.OrderId,
                OrderDate = order != null ? order.CreateDateTime.ToString("yyyy/MM/dd") : "",
                OrderItems = orderItems,
                Transactions = inv.Transactions.Select(t => new InvoiceTransactionQri
                {
                    Id = t.Id,
                    TransactionNumber = t.TransactionNumber,
                    TransactionDate = t.TransactionDate.ToString("yyyy/MM/dd HH:mm"),
                    Amount = t.Amount,
                    Status = ((ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations.TransactionStatus)t.Status).ToString(),
                    ReferenceNumber = t.ReferenceNumber,
                    Description = t.Description
                }).ToList()
            };
        }

        public async Task<List<AdminInvoiceQri>> GetAdminInvoicesAsync()
        {
            var invoices = await _dbContext.Invoices
                .AsNoTracking()
                .Include(i => i.Transactions)
                .OrderByDescending(i => i.InvoiceDate)
                .ToListAsync();

            var result = new List<AdminInvoiceQri>();
            foreach (var inv in invoices)
            {
                var student = await _dbContext.Students
                    .AsNoTracking()
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StudentId == inv.StudentId);

                result.Add(new AdminInvoiceQri
                {
                    Id = inv.Id,
                    InvoiceNumber = inv.InvoiceNumber,
                    InvoiceDate = inv.InvoiceDate.ToString("yyyy/MM/dd"),
                    TotalAmount = inv.TotalAmount,
                    PaidAmount = inv.PaidAmount,
                    RemainingAmount = inv.TotalAmount - inv.PaidAmount,
                    Status = ((ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations.InvoiceStatus)inv.Status).ToString(),
                    OrderId = inv.OrderId,
                    StudentId = inv.StudentId,
                    StudentName = student?.User == null
                        ? string.Empty
                        : $"{student.User.FirstName} {student.User.LastName}".Trim(),
                    StudentEmail = student?.User?.Email ?? string.Empty,
                    TransactionCount = inv.Transactions.Count
                });
            }

            return result;
        }

        public async Task<List<AdminPaymentQri>> GetAdminPaymentsAsync()
        {
            var transactions = await _dbContext.Transactions
                .AsNoTracking()
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            var result = new List<AdminPaymentQri>();
            foreach (var transaction in transactions)
            {
                var invoice = transaction.InvoiceId.HasValue
                    ? await _dbContext.Invoices.AsNoTracking().FirstOrDefaultAsync(i => i.Id == transaction.InvoiceId.Value)
                    : null;
                var student = invoice == null
                    ? null
                    : await _dbContext.Students
                        .AsNoTracking()
                        .Include(s => s.User)
                        .FirstOrDefaultAsync(s => s.StudentId == invoice.StudentId);

                result.Add(new AdminPaymentQri
                {
                    Id = transaction.Id,
                    InvoiceId = transaction.InvoiceId,
                    InvoiceNumber = invoice?.InvoiceNumber ?? string.Empty,
                    TransactionNumber = transaction.TransactionNumber,
                    TransactionDate = transaction.TransactionDate.ToString("yyyy/MM/dd HH:mm"),
                    Amount = transaction.Amount,
                    Status = ((ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations.TransactionStatus)transaction.Status).ToString(),
                    ReferenceNumber = transaction.ReferenceNumber,
                    Description = transaction.Description,
                    PaymentId = transaction.PaymentId,
                    StudentName = student?.User == null
                        ? string.Empty
                        : $"{student.User.FirstName} {student.User.LastName}".Trim(),
                    StudentEmail = student?.User?.Email ?? string.Empty
                });
            }

            return result;
        }
    }
}
