using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.EmailTemplates.EmailTemplateRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Queries.ListEmailTemplates;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailTemplateServices.Queries;

public class ListEmailTemplatesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailTemplateQueryRepository repository,
    IEmailTemplateCatalog catalog,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<ListEmailTemplatesQuery, List<EmailTemplateListItemQri>>(outer)
{
    public override async Task<QueryResult<List<EmailTemplateListItemQri>>> Handle(ListEmailTemplatesQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(new List<EmailTemplateListItemQri>(), ApplicationServiceStatus.ValidationError);

        var dbRows = await repository.ListFromDatabaseAsync();
        var dbLookup = dbRows.ToDictionary(x => x.TemplateKey, StringComparer.OrdinalIgnoreCase);

        var items = catalog.GetAll()
            .Select(def =>
            {
                if (dbLookup.TryGetValue(def.TemplateKey, out var row))
                {
                    return new EmailTemplateListItemQri
                    {
                        TemplateKey = row.TemplateKey,
                        DisplayName = row.DisplayName,
                        Description = row.Description,
                        IsEnabled = row.IsEnabled,
                        IsCustomized = row.IsCustomized
                    };
                }

                return new EmailTemplateListItemQri
                {
                    TemplateKey = def.TemplateKey,
                    DisplayName = def.DisplayName,
                    Description = def.Description,
                    IsEnabled = true,
                    IsCustomized = false
                };
            })
            .OrderBy(x => x.DisplayName)
            .ToList();

        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}
