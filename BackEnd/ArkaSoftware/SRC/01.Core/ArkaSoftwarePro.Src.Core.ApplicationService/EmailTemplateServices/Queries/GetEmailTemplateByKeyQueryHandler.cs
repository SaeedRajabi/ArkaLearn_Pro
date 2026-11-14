using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Queries.GetEmailTemplateByKey;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailTemplateServices.Queries;

public class GetEmailTemplateByKeyQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailTemplateProvider templateProvider,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetEmailTemplateByKeyQuery, EmailTemplateDetailQri>(outer)
{
    public override async Task<QueryResult<EmailTemplateDetailQri>> Handle(GetEmailTemplateByKeyQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(new EmailTemplateDetailQri(), ApplicationServiceStatus.ValidationError);

        var key = query.TemplateKey?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(key))
            return await ResultAsync(new EmailTemplateDetailQri(), ApplicationServiceStatus.ValidationError);

        try
        {
            var template = await templateProvider.GetTemplateAsync(key);
            return await ResultAsync(new EmailTemplateDetailQri
            {
                TemplateKey = template.TemplateKey,
                DisplayName = template.DisplayName,
                Description = template.Description,
                Subject = template.Subject,
                BodyHtml = template.BodyHtml,
                IsEnabled = template.IsEnabled,
                IsCustomized = template.IsCustomized
            }, ApplicationServiceStatus.Ok);
        }
        catch (KeyNotFoundException)
        {
            return await ResultAsync(new EmailTemplateDetailQri(), ApplicationServiceStatus.NotFound);
        }
    }
}
