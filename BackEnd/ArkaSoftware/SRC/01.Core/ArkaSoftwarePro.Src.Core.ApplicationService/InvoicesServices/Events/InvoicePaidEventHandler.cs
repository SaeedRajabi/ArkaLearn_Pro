using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById;
using Framework.Src.Core.Contracts.ApplicationService.Events;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.Events
{
    public class InvoicePaidEventHandler(
        IInvoiceQueryRepository invoiceQueryRepository,
        IOrderQueryRepository orderQueryRepository,
        IUserCommandRepository userCommandRepository,
        IStudentQueryRepository studentQueryRepository,
        CoursePurchaseFulfillmentService coursePurchaseFulfillmentService,
        ILogger<InvoicePaidEventHandler> logger
    ) : IDomainEventHandler<InvoicePaid>
    {
        public async Task Handle(InvoicePaid @event)
        {
            try
            {
                var invoice = await invoiceQueryRepository.GetInvoiceByIdAsync(new GetInvoiceByIdQuery { InvoiceId = @event.InvoiceId });
                if (invoice == null) throw new InvalidOperationException("Paid invoice was not found.");

                var order = await orderQueryRepository.GetOrderByIdAsync(new GetOrderByIdQuery { OrderId = invoice.OrderId });
                if (order == null || !order.OrderItems.Any()) throw new InvalidOperationException("Paid order or its items were not found.");

                // Order.StudentId is Student aggregate id — resolve portal user for email/name.
                var studentUserId = await studentQueryRepository.GetUserIdByStudentIdAsync(order.StudentId);
                var user = studentUserId is > 0
                    ? await userCommandRepository.GetAsync(studentUserId.Value)
                    : null;
                var email = user?.Email?.Value;
                var name = user != null
                    ? $"{user.UserFullName}".Trim()
                    : user?.UserName?.Value ?? "دانشجو";
                if (string.IsNullOrWhiteSpace(name))
                    name = "دانشجو";

                var items = order.OrderItems
                    .Select(item => (
                        item.CourseId,
                        string.IsNullOrWhiteSpace(item.CourseTitle)
                            ? $"دوره {item.CourseId}"
                            : item.CourseTitle))
                    .ToList();

                await coursePurchaseFulfillmentService.FulfillOrderItemsAsync(
                    order.StudentId,
                    items,
                    invoice.InvoiceNumber,
                    invoice.TotalAmount,
                    email,
                    name);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error handling InvoicePaid for invoice {InvoiceId}", @event.InvoiceId);
                throw;
            }
        }
    }
}
