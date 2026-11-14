using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events;
using Framework.Src.Core.Contracts.ApplicationService.Events;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.Events;

public class InvoicePaidTeacherFinanceEventHandler(
    TeacherFinanceService financeService,
    ILogger<InvoicePaidTeacherFinanceEventHandler> logger)
    : IDomainEventHandler<InvoicePaid>
{
    public async Task Handle(InvoicePaid @event)
    {
        try
        {
            await financeService.CreditCourseSalesFromInvoiceAsync(@event.InvoiceId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error crediting teacher finance for invoice {InvoiceId}", @event.InvoiceId);
                throw;
        }
    }
}
