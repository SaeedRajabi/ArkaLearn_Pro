using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Baskets.DiscountCodeRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.SearchDiscountCodes;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.OrdersServices.Queries;

public class SearchDiscountCodesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDiscountCodeCommandRepository discountCodeCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<SearchDiscountCodesQuery, PagedData<DiscountCodeListItemQri>>(outer)
{
    public override async Task<QueryResult<PagedData<DiscountCodeListItemQri>>> Handle(SearchDiscountCodesQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(new PagedData<DiscountCodeListItemQri>(), ApplicationServiceStatus.ValidationError);

        var (items, total) = await discountCodeCommandRepository.SearchAsync(
            query.InputValue,
            query.ScopeType,
            query.IsActive,
            query.TeacherId,
            query.StudentUserId,
            query.CourseId,
            query.PageNumber,
            query.PageSize,
            query.NeedTotalCount);

        var now = DateTime.UtcNow;
        var mapped = items.Select(x =>
        {
            x.CheckIfActive();
            return new DiscountCodeListItemQri
            {
                Id = x.Id,
                Code = x.Discount.Code ?? string.Empty,
                Title = x.Title,
                Amount = x.Discount.Amount,
                DiscountType = x.Discount.Type.ToString(),
                ExpirationDate = x.ExpirationDate,
                IsActive = x.IsActive,
                IsExpired = now >= x.ExpirationDate,
                UsageLimit = x.UsageLimit,
                UsedCount = x.UsedCount,
                ScopeType = (byte)x.ScopeType,
                ScopeLabel = ScopeLabel(x.ScopeType),
                TeacherId = x.TeacherId,
                StudentUserId = x.StudentUserId,
                CourseIds = x.CourseTargets.Select(t => t.CourseId).ToList()
            };
        }).ToList();

        return await ResultAsync(new PagedData<DiscountCodeListItemQri>
        {
            QueryResult = mapped,
            TotalCount = total,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        }, ApplicationServiceStatus.Ok);
    }

    private static string ScopeLabel(DiscountScopeType scope) => scope switch
    {
        DiscountScopeType.AllCourses => "All courses",
        DiscountScopeType.SpecificCourses => "Specific courses",
        DiscountScopeType.TeacherCourses => "Teacher courses",
        DiscountScopeType.StudentSpecific => "Student specific",
        _ => scope.ToString()
    };
}
