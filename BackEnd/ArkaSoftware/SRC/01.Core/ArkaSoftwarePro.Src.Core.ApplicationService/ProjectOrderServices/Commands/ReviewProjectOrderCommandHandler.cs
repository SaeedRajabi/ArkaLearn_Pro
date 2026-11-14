using ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Commands.ReviewProjectOrder;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectOrderServices.Commands;

public class ReviewProjectOrderCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectOrderCommandRepository orderRepository,
    IUserNotificationCommandRepository notificationRepository)
    : CommandHandler<ReviewProjectOrderCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ReviewProjectOrderCommand command)
    {
        if (command.ReviewerUserId <= 0)
            return await ResultAsync("Reviewer is not authenticated.", ApplicationServiceStatus.NotFound);

        var order = await orderRepository.GetGraphAsync(command.OrderId);
        if (order == null)
            return await ResultAsync($"Project order {command.OrderId} was not found.", ApplicationServiceStatus.NotFound);

        if (order.Status != ProjectOrderStatus.Submitted)
        {
            AddMessage("This order has already been reviewed.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var newStatus = command.Approve ? ProjectOrderStatus.Approved : ProjectOrderStatus.Rejected;
        order.Review(newStatus, command.ReviewerUserId, command.AdminNote);
        await orderRepository.CommitAsync();

        var statusLabel = command.Approve ? "approved" : "rejected";
        var title = command.Approve ? "Project order approved" : "Project order rejected";
        var body = command.Approve
            ? $"Your project request \"{order.Title}\" (#{order.RequestNumber}) has been approved."
            : $"Your project request \"{order.Title}\" (#{order.RequestNumber}) was not approved.";

        if (!string.IsNullOrWhiteSpace(command.AdminNote))
            body += $" Note: {command.AdminNote.Trim()}";

        if (order.UserId is > 0)
        {
            var notification = UserNotification.Create(
                order.UserId.Value,
                title,
                body,
                command.Approve ? "project_order_approved" : "project_order_rejected",
                "/account?view=project-orders",
                order.Id);

            await notificationRepository.InsertAsync(notification);
            await notificationRepository.CommitAsync();
        }

        return await OkAsync($"Project order {statusLabel}.");
    }
}
