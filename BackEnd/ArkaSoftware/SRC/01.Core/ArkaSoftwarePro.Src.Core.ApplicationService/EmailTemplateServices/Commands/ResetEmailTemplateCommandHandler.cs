using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.EmailTemplates.EmailTemplateRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Commands.ResetEmailTemplate;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailTemplateServices.Commands;

public class ResetEmailTemplateCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailTemplateCommandRepository repository,
    IEmailTemplateCatalog catalog,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ResetEmailTemplateCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ResetEmailTemplateCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        var key = command.TemplateKey?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(key))
            return await ResultAsync("Template key is required.", ApplicationServiceStatus.ValidationError);

        if (!catalog.TryGet(key, out var definition))
            return await ResultAsync("Unknown template key.", ApplicationServiceStatus.NotFound);

        var current = await repository.GetByKeyAsync(key);
        if (current is null)
            return await OkAsync("Template is already using system defaults.");

        repository.Delete(current);
        await repository.CommitAsync();
        return await OkAsync("Email template reset to default.");
    }
}
