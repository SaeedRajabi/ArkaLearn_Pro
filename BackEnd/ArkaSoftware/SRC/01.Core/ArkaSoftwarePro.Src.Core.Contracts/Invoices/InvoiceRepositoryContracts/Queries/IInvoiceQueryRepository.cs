using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.AdminFinance;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetMyInvoices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById;
using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries
{
    /// <summary>
    /// اینترفیس Repository برای عملیات خواندن فاکتور
    /// </summary>
    public interface IInvoiceQueryRepository : IQueryRepository
    {
        Task<List<GetMyInvoicesQri>> GetMyInvoicesAsync(GetMyInvoicesQuery query);
        Task<GetInvoiceByIdQri?> GetInvoiceByIdAsync(GetInvoiceByIdQuery query);
        Task<List<AdminInvoiceQri>> GetAdminInvoicesAsync();
        Task<List<AdminPaymentQri>> GetAdminPaymentsAsync();
    }
}
