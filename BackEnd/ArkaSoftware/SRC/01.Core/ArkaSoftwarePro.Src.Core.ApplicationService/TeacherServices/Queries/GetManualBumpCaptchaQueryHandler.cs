using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetManualBumpCaptcha;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetManualBumpCaptchaQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ManualBumpCaptchaService captchaService,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetManualBumpCaptchaQuery, ManualBumpCaptchaQri>(outer)
{
    public override async Task<QueryResult<ManualBumpCaptchaQri>> Handle(GetManualBumpCaptchaQuery query)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var (captchaId, displayCode) = captchaService.Generate(userId);
        return await ResultAsync(new ManualBumpCaptchaQri
        {
            CaptchaId = captchaId,
            DisplayCode = displayCode,
        }, ApplicationServiceStatus.Ok);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
