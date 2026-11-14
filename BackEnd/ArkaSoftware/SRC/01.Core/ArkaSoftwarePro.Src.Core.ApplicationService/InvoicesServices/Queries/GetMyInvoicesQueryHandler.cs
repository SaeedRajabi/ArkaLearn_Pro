using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetMyInvoices;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.Queries
{
    /// <summary>
    /// هندلر کوئری دریافت فاکتورهای کاربر
    /// </summary>
    public class GetMyInvoicesQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IInvoiceQueryRepository invoiceQueryRepository
        ) : QueryHandler<GetMyInvoicesQuery, List<GetMyInvoicesQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<List<GetMyInvoicesQri>>> Handle(GetMyInvoicesQuery query)
        {
            try
            {
                var invoices = await invoiceQueryRepository.GetMyInvoicesAsync(query);
                if (invoices == null || !invoices.Any())
                    return await ResultAsync(new List<GetMyInvoicesQri>(), ApplicationServiceStatus.Ok);

                return await ResultAsync(invoices, ApplicationServiceStatus.Ok);
            }
            catch (Exception e)
            {
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            }
        }
    }
}
