using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.PlatformSupportTopics.PlatformSupportTopicRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.PlatformSupportTopicAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Commands.UpsertPlatformSupportTopic;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.PlatformSupportTopicServices.Commands;

public class UpsertPlatformSupportTopicCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPlatformSupportTopicCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertPlatformSupportTopicCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertPlatformSupportTopicCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        var title = command.Title?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(title))
            return await ResultAsync("Title is required.", ApplicationServiceStatus.ValidationError);

        if (string.IsNullOrWhiteSpace(command.ContentHtml))
            return await ResultAsync("Content is required.", ApplicationServiceStatus.ValidationError);

        PlatformSupportTopic topic;
        if (command.Id is > 0)
        {
            topic = await repository.GetByIdAsync(command.Id.Value);
            if (topic == null || topic.IsDelete)
                return await ResultAsync("Topic not found.", ApplicationServiceStatus.NotFound);

            topic.Update(
                title,
                command.Summary,
                command.ContentHtml,
                command.Department,
                command.SortOrder,
                command.IsPublished);
        }
        else
        {
            topic = new PlatformSupportTopic(
                title,
                command.Summary,
                command.ContentHtml,
                command.Department,
                command.SortOrder,
                command.IsPublished);
            await repository.InsertAsync(topic);
        }

        await repository.CommitAsync();
        return await OkAsync(topic.Id.ToString());
    }
}
