using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.Queries
{
    /// <summary>
    /// هندلر کوئری دریافت فاکتور بر اساس شناسه
    /// </summary>
    public class GetInvoiceByIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IInvoiceQueryRepository invoiceQueryRepository
    ) : QueryHandler<GetInvoiceByIdQuery, GetInvoiceByIdQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<GetInvoiceByIdQri>> Handle(GetInvoiceByIdQuery query)
        {
            try
            {
                var invoice = await invoiceQueryRepository.GetInvoiceByIdAsync(query);
                if (invoice == null)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

                return await ResultAsync(invoice, ApplicationServiceStatus.Ok);
            }
            catch (Exception e)
            {
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            }
        }
    }
}
