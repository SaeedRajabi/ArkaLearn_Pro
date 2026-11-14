using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Baskets.DiscountCodeRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.DeactivateDiscountCode;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.OrdersServices.Commands;

public class DeactivateDiscountCodeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDiscountCodeCommandRepository discountCodeCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<DeactivateDiscountCodeCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(DeactivateDiscountCodeCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Only dashboard admin can deactivate discount codes.");
            return await ResultAsync(new { message = "Forbidden" }, ApplicationServiceStatus.ValidationError);
        }

        if (command.Id <= 0)
        {
            AddMessage("Id is required.");
            return await ResultAsync(new { message = "Id is required." }, ApplicationServiceStatus.ValidationError);
        }

        var entity = await discountCodeCommandRepository.GetAsync(command.Id);
        if (entity is null || entity.Id <= 0)
        {
            AddMessage("Discount code not found.");
            return await ResultAsync(new { message = "Not found" }, ApplicationServiceStatus.NotFound);
        }

        entity.Deactivate();
        await discountCodeCommandRepository.CommitAsync();
        return await OkAsync(new { id = entity.Id, isActive = entity.IsActive, message = "Discount code deactivated." });
    }
}
