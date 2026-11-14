using ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Commands.ResetEmailTemplate;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Commands.UpsertEmailTemplate;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Queries.GetEmailTemplateByKey;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Queries.ListEmailTemplates;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class EmailTemplatesController : BaseController
{
    [HttpGet("List")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> List([FromQuery] ListEmailTemplatesQuery query)
        => await Query<ListEmailTemplatesQuery, List<EmailTemplateListItemQri>>(query);

    [HttpGet("GetByKey")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetByKey([FromQuery] GetEmailTemplateByKeyQuery query)
        => await Query<GetEmailTemplateByKeyQuery, EmailTemplateDetailQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertEmailTemplateCommand command)
        => await Create<UpsertEmailTemplateCommand, string>(command);

    [HttpPost("Reset")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Reset([FromBody] ResetEmailTemplateCommand command)
        => await Create<ResetEmailTemplateCommand, string>(command);
}
