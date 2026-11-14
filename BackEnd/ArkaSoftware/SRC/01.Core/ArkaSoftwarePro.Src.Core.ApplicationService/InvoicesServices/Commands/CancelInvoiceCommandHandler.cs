using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.CancelInvoice;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.Commands
{
    /// <summary>
    /// هندلر کامند لغو فاکتور
    /// </summary>
    public class CancelInvoiceCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IInvoiceCommandRepository invoiceCommandRepository
    ) : CommandHandler<CancelInvoiceCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(CancelInvoiceCommand command)
        {
            try
            {
                var invoice = await invoiceCommandRepository.GetGraphAsync(command.InvoiceId);
                if (invoice == null)
                    return await ResultAsync("Invoice not found.", ApplicationServiceStatus.NotFound);

                invoice.Cancel(command.Reason);

                await invoiceCommandRepository.CommitAsync();

                return await OkAsync($"Invoice cancelled successfully: {invoice.InvoiceNumber?.Value}");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Error cancelling invoice: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
