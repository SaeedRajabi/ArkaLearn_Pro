using ArkaSoftwarePro.Src.Core.Contracts.Baskets.DiscountCodeRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateOrderFromClientBasket;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Contracts.ApplicationService.Events;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.OrdersServices.Commands
{
    public class CreateOrderFromClientBasketCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IOrderCommandRepository orderCommandRepository,
        IInvoiceCommandRepository invoiceCommandRepository,
        IStudentQueryRepository studentQueryRepository,
        IStudentCommandRepository studentCommandRepository,
        ICourseQueriesRepository courseQueriesRepository,
        IDiscountCodeCommandRepository discountCodeCommandRepository,
        IDomainEventDispatcher domainEventDispatcher,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<CreateOrderFromClientBasketCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(CreateOrderFromClientBasketCommand command)
        {
            try
            {
                var userIdStr = httpContextAccessor.HttpContext?.User.FindFirst("userId")?.Value ??
                               httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdStr) || !long.TryParse(userIdStr, out var userId))
                    return await ResultAsync("User not authenticated", ApplicationServiceStatus.NotFound);

                var studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(userId);
                if (!studentId.HasValue)
                    return await ResultAsync("Student profile not found", ApplicationServiceStatus.NotFound);

                var student = await studentCommandRepository.GetAsync(studentId.Value);
                if (student == null!)
                    return await ResultAsync("Student entity not found", ApplicationServiceStatus.NotFound);

                var order = new Order(student);

                var courseTitles = new List<string>();
                foreach (var item in command.Items)
                {
                    var course = await courseQueriesRepository.GetCourseByIdExecuteAsync(
                        new RequestResponse.Courses.Queries.GetCoursesById.GetCourseByIdQuery { CourseId = item.CourseId });

                    if (course != null)
                    {
                        if (!course.CanRegister)
                        {
                            return await ResultAsync(
                                $"Registration is closed for course: {course.Title}",
                                ApplicationServiceStatus.ValidationError);
                        }

                        var title = !string.IsNullOrWhiteSpace(course.Title)
                            ? course.Title
                            : item.CourseName;
                        if (!string.IsNullOrWhiteSpace(title))
                            courseTitles.Add(title.Trim());

                        var price = course.CheckoutPrice > 0 ? course.CheckoutPrice : course.Price;
                        var orderItem = new OrderItem(item.CourseId, new OrderMoney(price), item.Quantity);
                        order.AddOrderItem(orderItem);
                    }
                }

                if (!order.OrderItems.Any())
                    return await ResultAsync("No valid items in basket", ApplicationServiceStatus.Exception);

                await orderCommandRepository.InsertAsync(order);
                await orderCommandRepository.CommitAsync();

                var totalAmount = order.OrderItems.Sum(x => x.TotalPrice);
                decimal discountAmount = 0;
                string? appliedCode = null;

                if (!string.IsNullOrWhiteSpace(command.DiscountCode))
                {
                    var discountEntity = await discountCodeCommandRepository.GetByCodeAsync(command.DiscountCode);
                    if (discountEntity is null)
                        return await ResultAsync("Invalid discount code.", ApplicationServiceStatus.ValidationError);

                    try
                    {
                        var basketLines = new List<(long CourseId, long TeacherId, decimal LineTotal)>();
                        foreach (var oi in order.OrderItems)
                        {
                            var teacherId = await courseQueriesRepository.GetCourseTeacherIdAsync(oi.CourseId) ?? 0;
                            basketLines.Add((oi.CourseId, teacherId, oi.TotalPrice));
                        }

                        var eligibleSubtotal = discountEntity.GetEligibleSubtotal(userId, basketLines);
                        if (eligibleSubtotal <= 0)
                            return await ResultAsync(
                                "This discount code does not apply to the items in your cart.",
                                ApplicationServiceStatus.ValidationError);

                        discountAmount = discountEntity.PeekDiscountAmount(eligibleSubtotal);
                        discountEntity.RecordUsage();
                        await discountCodeCommandRepository.CommitAsync();
                        appliedCode = discountEntity.Discount.Code ?? command.DiscountCode.Trim().ToUpperInvariant();
                    }
                    catch (Exception ex)
                    {
                        return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
                    }
                }

                var finalAmount = Math.Max(0, totalAmount - discountAmount);

                var invoiceNumber = InvoiceNumber.Generate(order.Id, DateTime.UtcNow);

                var description = BuildInvoiceDescription(command.Description, courseTitles);
                if (discountAmount > 0 && !string.IsNullOrWhiteSpace(appliedCode))
                {
                    description = (description != null ? description + "\n" : "") +
                                  $"Discount applied: {discountAmount:N0} ({appliedCode})";
                }

                var invoice = new Invoice(
                    invoiceNumber,
                    order.Id,
                    studentId.Value,
                    finalAmount,
                    description
                );

                invoice.Issue();

                await invoiceCommandRepository.InsertAsync(invoice);
                await invoiceCommandRepository.CommitAsync();

                if (finalAmount == 0)
                {
                    invoice.MarkAsPaidWithoutPayment();
                    await invoiceCommandRepository.CommitAsync();
                    await domainEventDispatcher.PublishDomainEventAsync(
                        new InvoicePaid(invoice.Id, invoice.InvoiceNumber!.Value, invoice.PaidAmount));
                }

                return await OkAsync(invoice.Id.ToString());
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Error creating order: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }

        private static string? BuildInvoiceDescription(string? userDescription, IReadOnlyList<string> courseTitles)
        {
            if (!string.IsNullOrWhiteSpace(userDescription) &&
                !string.Equals(userDescription.Trim(), "No description", StringComparison.OrdinalIgnoreCase))
            {
                return userDescription.Trim();
            }

            if (courseTitles.Count == 0)
                return null;

            return $"ثبت‌نام دوره: {string.Join("، ", courseTitles)}";
        }
    }
}
