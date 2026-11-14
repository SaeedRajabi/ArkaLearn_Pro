using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.EmailTemplates.EmailTemplateRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.EmailTemplateAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Commands.UpsertEmailTemplate;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailTemplateServices.Commands;

public class UpsertEmailTemplateCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailTemplateCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertEmailTemplateCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertEmailTemplateCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        var key = command.TemplateKey?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(key))
            return await ResultAsync("Template key is required.", ApplicationServiceStatus.ValidationError);

        var current = await repository.GetByKeyAsync(key);
        if (current is null)
        {
            current = new EmailTemplate(
                key,
                command.DisplayName,
                command.Description,
                command.Subject,
                command.BodyHtml,
                command.IsEnabled);
            current.SetTemplateKey(key);
            await repository.InsertAsync(current);
        }
        else
        {
            current.Update(
                command.DisplayName,
                command.Description,
                command.Subject,
                command.BodyHtml,
                command.IsEnabled);
        }

        await repository.CommitAsync();
        return await OkAsync("Email template saved.");
    }
}
