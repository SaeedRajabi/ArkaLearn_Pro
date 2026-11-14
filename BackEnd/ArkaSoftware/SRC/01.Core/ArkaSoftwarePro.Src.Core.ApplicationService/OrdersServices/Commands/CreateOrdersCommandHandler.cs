// using ArkaSoftwarePro.Src.Core.Contracts.Orders.UnitOfWorksContract;
// using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
// using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Enumerations;
// using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.ValueOBJs;
// using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateOrders;
// using Framework.Src.Core.ApplicationService.Commands;
// using Framework.Src.Core.RequestResponse.Commands;
// using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
// using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
// using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketByUserId;
// using Framework.Src.Utilities.OutService.Services;
//
// namespace ArkaSoftwarePro.Src.Core.ApplicationService.OrdersServices.Commands
// {
//     public class CreateOrdersCommandHandler(
//         ArkaSoftwareCMPOutServices mafiaOuterServices,
//         IOrderUnitOfWork orderUnitOfWork)
//         : CommandHandler<CreateOrdersCommand, string>(mafiaOuterServices)
//     {
//         public override async Task<CommandResult<string>> HandleAsync(CreateOrdersCommand command)
//         {
//             // 1. Find Basket
//             var basket = await orderUnitOfWork.BasketQueryRepository
//                 .GetBasketByUserIdExecuteAsync(
//                     new GetBasketByUserIdQuery(){UserId = command.UserId}
//                     );
//             
//             
//             
//             
//
//             // 2. Find Student (User)
//             var student = await dbContext.Students.FirstOrDefaultAsync(s => s.UserId == command.UserId);
//             if (student == null)
//             {
//                  // Auto-create Student profile if missing
//                  student = new Student(command.UserId);
//                  dbContext.Students.Add(student);
//                  await dbContext.SaveChangesAsync();
//             }
//
//             // 3. Create Order
//             var order = new Order(student);
//             
//             foreach (var item in basket.BasketItems)
//             {
//                 // Create OrderItem
//                 var priceAmount = item.Course?.Price?.Amount ?? 0;
//                 var unitPrice = new OrderMoney(priceAmount);
//                 var orderItem = new OrderItem(item.CourseId, unitPrice, item.Quantity);
//                 order.AddOrderItem(orderItem);
//             }
//             
//             // 4. Update Order Status
//             order.UpdateStatus(OrderStatus.COMPLETED);
//             dbContext.Orders.Add(order);
//             
//             // 5. Add to Enrollments (Mocking immediate enrollment upon order)
//             foreach (var item in basket.BasketItems)
//             {
//                 var exists = await dbContext.Enrollments.AnyAsync(e => e.StudentId == student.Id && e.CourseId == item.CourseId);
//                 if (!exists)
//                 {
//                     // Enrollment(long studentId, long courseId, bool isActive)
//                     var enrollment = new Enrollment(student.Id, item.CourseId, true);
//                     dbContext.Enrollments.Add(enrollment);
//                 }
//             }
//
//             // 6. Clear Basket (or mark as payed)
//             // If basket entity supports soft delete or payed flag, use it.
//             // Basket.cs check needed. Assuming remove for now as per previous code.
//             dbContext.Baskets.Remove(basket);
//
//             await dbContext.SaveChangesAsync();
//
//             return new CommandResult<string> { Result = order.Id.ToString() };
//         }
//
//         public override async Task<CommandResult<string>> Handle(CreateOrdersCommand command)
//         {
//             try
//             {
//                 var basketFindAsync = await orderUnitOfWork.BasketCommandRepository.GetGraphAsync(command.UserId);
//             }
//             catch (Exception e)
//             {
//                 Console.WriteLine(e);
//                 throw;
//             }
//         }
//     }
// }
