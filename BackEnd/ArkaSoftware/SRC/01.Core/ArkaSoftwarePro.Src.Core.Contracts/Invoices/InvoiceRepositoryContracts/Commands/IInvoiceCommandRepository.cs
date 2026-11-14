using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Commands
{
    /// <summary>
    /// اینترفیس Repository برای عملیات نوشتن فاکتور
    /// </summary>
    public interface IInvoiceCommandRepository : ICommandRepository<Invoice, long>
    {
    }
}
