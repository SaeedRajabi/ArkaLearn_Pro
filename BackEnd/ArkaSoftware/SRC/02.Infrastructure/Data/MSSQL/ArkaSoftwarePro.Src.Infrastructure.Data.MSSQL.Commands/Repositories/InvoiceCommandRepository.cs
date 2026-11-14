using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class InvoiceCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Invoice, ArkaSoftwareCommandDbContext>(dbContext), IInvoiceCommandRepository;
}
