using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Baskets.DiscountCodeRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateDiscountCode;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.OrdersServices.Commands;

public class CreateDiscountCodeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDiscountCodeCommandRepository discountCodeCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<CreateDiscountCodeCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(CreateDiscountCodeCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Only dashboard admin can create discount codes.");
            return await ResultAsync(new { message = "Forbidden" }, ApplicationServiceStatus.ValidationError);
        }

        var code = (command.Code ?? string.Empty).Trim().ToUpperInvariant();
        if (await discountCodeCommandRepository.ExistsByCodeAsync(code))
        {
            AddMessage("A discount code with this value already exists.");
            return await ResultAsync(new { message = "Duplicate code" }, ApplicationServiceStatus.ValidationError);
        }

        DateTime expirationUtc;
        try
        {
            expirationUtc = ResolveExpirationUtc(command);
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(new { message = ex.Message }, ApplicationServiceStatus.ValidationError);
        }

        if (expirationUtc <= DateTime.UtcNow)
        {
            AddMessage("Expiration must be in the future.");
            return await ResultAsync(new { message = "Invalid expiration" }, ApplicationServiceStatus.ValidationError);
        }

        if (!Enum.IsDefined(typeof(DiscountType), command.DiscountType))
        {
            AddMessage("Invalid discount type.");
            return await ResultAsync(new { message = "Invalid discount type" }, ApplicationServiceStatus.ValidationError);
        }

        if (!Enum.IsDefined(typeof(DiscountScopeType), command.ScopeType))
        {
            AddMessage("Invalid discount scope.");
            return await ResultAsync(new { message = "Invalid scope" }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var discount = Discount.Create(command.Amount, (DiscountType)command.DiscountType, code);
            var entity = DiscountCode.Create(
                discount,
                expirationUtc,
                command.UsageLimit,
                (DiscountScopeType)command.ScopeType,
                command.TeacherId,
                command.StudentUserId,
                command.CourseIds,
                command.Title);

            await discountCodeCommandRepository.InsertAsync(entity);
            await discountCodeCommandRepository.CommitAsync();

            return await OkAsync(new
            {
                id = entity.Id,
                code = entity.Discount.Code,
                expirationDate = entity.ExpirationDate,
                scopeType = (byte)entity.ScopeType,
                message = "Discount code created."
            });
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(new { message = ex.Message }, ApplicationServiceStatus.ValidationError);
        }
    }

    private static DateTime ResolveExpirationUtc(CreateDiscountCodeCommand command)
    {
        if (command.ExpirationDate.HasValue)
        {
            var dt = command.ExpirationDate.Value;
            return dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt.ToUniversalTime(), DateTimeKind.Utc);
        }

        var value = command.DurationValue ?? 0;
        if (value <= 0)
            throw new InvalidOperationException("Duration value must be greater than zero.");

        var unit = (command.DurationUnit ?? "days").Trim().ToLowerInvariant();
        return unit switch
        {
            "hour" or "hours" or "h" => DateTime.UtcNow.AddHours(value),
            "day" or "days" or "d" => DateTime.UtcNow.AddDays(value),
            "month" or "months" or "m" => DateTime.UtcNow.AddMonths(value),
            _ => throw new InvalidOperationException("Duration unit must be hours, days, or months.")
        };
    }
}
