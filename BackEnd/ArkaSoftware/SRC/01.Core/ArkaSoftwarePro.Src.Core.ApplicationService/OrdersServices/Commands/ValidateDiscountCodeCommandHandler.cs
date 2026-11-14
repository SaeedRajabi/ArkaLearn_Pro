using ArkaSoftwarePro.Src.Core.Contracts.Baskets.DiscountCodeRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.ValidateDiscountCode;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.OrdersServices.Commands;

public class ValidateDiscountCodeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDiscountCodeCommandRepository discountCodeCommandRepository,
    ICourseQueriesRepository courseQueriesRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ValidateDiscountCodeCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(ValidateDiscountCodeCommand command)
    {
        var code = (command.Code ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(code))
        {
            AddMessage("Discount code is required.");
            return await ResultAsync(new { message = "Discount code is required." }, ApplicationServiceStatus.ValidationError);
        }

        if (command.Subtotal < 0)
        {
            AddMessage("Invalid subtotal.");
            return await ResultAsync(new { message = "Invalid subtotal." }, ApplicationServiceStatus.ValidationError);
        }

        var entity = await discountCodeCommandRepository.GetByCodeAsync(code);
        if (entity is null)
        {
            AddMessage("Invalid discount code.");
            return await ResultAsync(new { message = "Invalid discount code." }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var userId = TryGetUserId();
            var lines = await BuildBasketLinesAsync(command);
            var eligibleSubtotal = entity.GetEligibleSubtotal(userId, lines);

            if (eligibleSubtotal <= 0)
            {
                AddMessage("This discount code does not apply to the items in your cart.");
                return await ResultAsync(
                    new { message = "This discount code does not apply to the items in your cart." },
                    ApplicationServiceStatus.ValidationError);
            }

            var discountAmount = entity.PeekDiscountAmount(eligibleSubtotal);
            var type = entity.Discount.Type;
            return await OkAsync(new
            {
                code = entity.Discount.Code ?? code.ToUpperInvariant(),
                discountAmount,
                eligibleSubtotal,
                type = type.ToString(),
                percentage = type == DiscountType.PERCENTAGE ? (decimal?)entity.Discount.Amount : null,
                scopeType = (byte)entity.ScopeType,
                message = "Discount code applied."
            });
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(new { message = ex.Message }, ApplicationServiceStatus.ValidationError);
        }
    }

    private long? TryGetUserId()
    {
        var userIdStr = httpContextAccessor.HttpContext?.User.FindFirst("userId")?.Value ??
                        httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(userIdStr, out var userId) ? userId : null;
    }

    private async Task<List<(long CourseId, long TeacherId, decimal LineTotal)>> BuildBasketLinesAsync(
        ValidateDiscountCodeCommand command)
    {
        var courseIds = (command.CourseIds ?? new List<long>())
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (courseIds.Count == 0)
        {
            // Backward compatible: treat entire subtotal as eligible for AllCourses scope only.
            return new List<(long, long, decimal)> { (0, 0, command.Subtotal) };
        }

        var lines = new List<(long CourseId, long TeacherId, decimal LineTotal)>();
        for (var i = 0; i < courseIds.Count; i++)
        {
            var courseId = courseIds[i];
            var teacherId = await courseQueriesRepository.GetCourseTeacherIdAsync(courseId) ?? 0;
            decimal lineTotal;
            if (command.LineTotals is { Count: > 0 } && i < command.LineTotals.Count)
                lineTotal = Math.Max(0, command.LineTotals[i]);
            else
                lineTotal = courseIds.Count == 1
                    ? command.Subtotal
                    : Math.Round(command.Subtotal / courseIds.Count, 0, MidpointRounding.AwayFromZero);

            lines.Add((courseId, teacherId, lineTotal));
        }

        return lines;
    }
}
