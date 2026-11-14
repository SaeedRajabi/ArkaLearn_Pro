using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementMonetizationRevenue;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetAdvertisementMonetizationRevenueQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetAdvertisementMonetizationRevenueQuery, AdvertisementMonetizationRevenueReportQri>(outer)
{
    public override async Task<QueryResult<AdvertisementMonetizationRevenueReportQri>> Handle(GetAdvertisementMonetizationRevenueQuery query)
    {
        if (!IsAdminUser())
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var revenues = await teacherCommandRepository.GetMonetizationRevenuesAsync(query.FromUtc, query.ToUtc);
        var report = new AdvertisementMonetizationRevenueReportQri
        {
            Items = revenues.Select(r => new AdvertisementRevenueItemQri
            {
                Id = r.Id,
                RevenueType = r.RevenueType.ToString(),
                TeacherId = r.TeacherId,
                PayerUserId = r.PayerUserId,
                AmountToman = r.AmountToman,
                PaymentReference = r.PaymentReference,
                Description = r.Description,
                OccurredAtUtc = r.OccurredAtUtc,
            }).ToList(),
        };

        foreach (var item in revenues)
        {
            report.TotalToman += item.AmountToman;
            switch (item.RevenueType)
            {
                case AdvertisementRevenueType.Subscription:
                    report.SubscriptionToman += item.AmountToman;
                    break;
                case AdvertisementRevenueType.ContactUnlock:
                    report.ContactUnlockToman += item.AmountToman;
                    break;
                case AdvertisementRevenueType.OneTimeBump:
                    report.OneTimeBumpToman += item.AmountToman;
                    break;
                case AdvertisementRevenueType.AutoBumpPackage:
                    report.AutoBumpPackageToman += item.AmountToman;
                    break;
            }
        }

        return await ResultAsync(report, ApplicationServiceStatus.Ok);
    }

    private bool IsAdminUser()
    {
        var roleClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value;
        return roleClaim is "3" or "Admin" or "Super Admin";
    }
}
