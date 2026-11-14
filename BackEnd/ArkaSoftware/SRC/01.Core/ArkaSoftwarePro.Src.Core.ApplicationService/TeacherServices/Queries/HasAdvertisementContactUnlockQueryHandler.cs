using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.HasAdvertisementContactUnlock;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class HasAdvertisementContactUnlockQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    TeacherAdvertisingEntitlements entitlements,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<HasAdvertisementContactUnlockQuery, ContactUnlockStatusQri>(outer)
{
    public override async Task<QueryResult<ContactUnlockStatusQri>> Handle(HasAdvertisementContactUnlockQuery query)
    {
        var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(query.TeacherId);
        if (teacher == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        var viewerUserId = ResolveUserId();
        var paidFeatures = await entitlements.HasPaidFeaturesAsync(teacher);
        var canShow = await entitlements.CanShowContactToViewerAsync(teacher, viewerUserId > 0 ? viewerUserId : null);

        DateTime? expiresAt = null;
        if (viewerUserId > 0 && !paidFeatures)
        {
            var unlock = await teacherCommandRepository.GetValidContactUnlockAsync(viewerUserId, teacher.Id);
            expiresAt = unlock?.ExpiresAtUtc;
        }

        return await ResultAsync(new ContactUnlockStatusQri
        {
            IsUnlocked = canShow && !paidFeatures,
            ContactVisibleWithoutPayment = paidFeatures,
            ExpiresAtUtc = expiresAt,
            UnlockPriceToman = settings.ContactUnlockPriceToman,
        }, ApplicationServiceStatus.Ok);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
