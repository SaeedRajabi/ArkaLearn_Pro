using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.AddTransaction;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Contracts.ApplicationService.Events;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.Commands
{
    /// <summary>
    /// هندلر کامند افزودن تراکنش به فاکتور
    /// </summary>
    public class AddTransactionCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IInvoiceCommandRepository invoiceCommandRepository,
        IDomainEventDispatcher domainEventDispatcher
    ) : CommandHandler<AddTransactionCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddTransactionCommand command)
        {
            try
            {
                var invoice = await invoiceCommandRepository.GetGraphAsync(command.InvoiceId);
                if (invoice == null)
                    return await ResultAsync("Invoice not found.", ApplicationServiceStatus.NotFound);

                var amount = command.Amount > 0 ? command.Amount : invoice.RemainingAmount;

                var transactionNumber = TransactionNumber.Generate(command.InvoiceId, DateTime.UtcNow);
                var transaction = Transaction.Create(
                    transactionNumber,
                    amount,
                    TransactionStatus.SUCCESS,
                    command.InvoiceId,
                    command.PaymentId,
                    command.ReferenceNumber,
                    command.Description
                );

                invoice.AddTransaction(transaction);

                await invoiceCommandRepository.CommitAsync();

                // Outbox alone is never processed — publish paid event in-process so enrollment + teacher finance run.
                if (invoice.Status == InvoiceStatus.PAID)
                {
                    await domainEventDispatcher.PublishDomainEventAsync(
                        new InvoicePaid(invoice.Id, invoice.InvoiceNumber!.Value, invoice.PaidAmount));
                }

                return await OkAsync($"Transaction added successfully with number: {transactionNumber.Value}");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Error adding transaction: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
