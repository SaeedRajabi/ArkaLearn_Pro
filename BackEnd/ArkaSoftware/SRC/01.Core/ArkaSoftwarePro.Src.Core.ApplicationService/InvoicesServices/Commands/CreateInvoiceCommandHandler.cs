using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.CreateInvoice;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices.Commands
{
    /// <summary>
    /// هندلر کامند ایجاد فاکتور از سفارش
    /// </summary>
    public class CreateInvoiceCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IInvoiceCommandRepository invoiceCommandRepository,
        IOrderQueryRepository orderQueryRepository,
        IStudentQueryRepository studentQueryRepository
    ) : CommandHandler<CreateInvoiceCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(CreateInvoiceCommand command)
        {
            try
            {
                // 1. دریافت سفارش
                var orderQuery = new GetOrderByIdQuery { OrderId = command.OrderId };
                var order = await orderQueryRepository.GetOrderByIdAsync(orderQuery);
                
                if (order == null)
                    return await ResultAsync("Order not found.", ApplicationServiceStatus.NotFound);

                // 2. دریافت StudentId از UserId
                var studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(command.StudentId);
                if (!studentId.HasValue)
                    return await ResultAsync("Student not found for this user.", ApplicationServiceStatus.NotFound);

                // بررسی اینکه آیا فاکتور برای این سفارش قبلاً ایجاد شده است یا نه
                // (این بررسی را می‌توان در Repository انجام داد - فعلاً نادیده می‌گیریم)

                // محاسبه مبلغ کل از OrderItems
                var totalAmount = order.OrderItems?.Sum(item => item.TotalPrice) ?? 0;

                if (totalAmount <= 0)
                    return await ResultAsync("Order total amount must be greater than zero.", ApplicationServiceStatus.Exception);

                // ایجاد Invoice
                var invoiceNumber = InvoiceNumber.Generate(command.OrderId, DateTime.UtcNow);
                var invoice = new Invoice(
                    invoiceNumber,
                    command.OrderId,
                    studentId.Value,
                    totalAmount,
                    command.Description
                );

                // صادر کردن فاکتور (از DRAFT به ISSUED)
                invoice.Issue();

                await invoiceCommandRepository.InsertAsync(invoice);
                await invoiceCommandRepository.CommitAsync();

                return await OkAsync($"Invoice created successfully with number: {invoiceNumber.Value}");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Error creating invoice: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
