using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.IssueInvoice;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.Commands
{
    /// <summary>
    /// هندلر کامند صادر کردن فاکتور
    /// </summary>
    public class IssueInvoiceCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IInvoiceCommandRepository invoiceCommandRepository
    ) : CommandHandler<IssueInvoiceCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(IssueInvoiceCommand command)
        {
            try
            {
                var invoice = await invoiceCommandRepository.GetGraphAsync(command.InvoiceId);
                if (invoice == null)
                    return await ResultAsync("Invoice not found.", ApplicationServiceStatus.NotFound);

                invoice.Issue();

                await invoiceCommandRepository.CommitAsync();

                return await OkAsync($"Invoice issued successfully: {invoice.InvoiceNumber?.Value}");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Error issuing invoice: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
