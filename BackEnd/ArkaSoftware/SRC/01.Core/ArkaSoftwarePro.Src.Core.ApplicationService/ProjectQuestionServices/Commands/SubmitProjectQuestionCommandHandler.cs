using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.SubmitProjectQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectQuestionServices.Commands;

public class SubmitProjectQuestionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectQuestionCommandRepository questionRepository,
    IProjectQueriesRepository projectQueriesRepository,
    IUserNotificationCommandRepository notificationRepository,
    IUserQueryRepository userQueryRepository,
    IProjectQaRealtimeNotifier realtimeNotifier)
    : CommandHandler<SubmitProjectQuestionCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SubmitProjectQuestionCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var project = await projectQueriesRepository.GetProjectByIdExecuteAsync(
            new GetProjectByIdQuery { ProjectId = command.ProjectId });
        if (project == null)
            return await ResultAsync("Project not found.", ApplicationServiceStatus.NotFound);

        var content = command.ContentHtml ?? string.Empty;
        if (content.Replace("<p></p>", "").Trim().Length < 10 && string.IsNullOrWhiteSpace(command.AudioUrl))
        {
            AddMessage("Question content is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var question = ProjectQuestion.Submit(
            command.ProjectId,
            command.UserId,
            command.Subject,
            content,
            command.AudioUrl);

        await questionRepository.InsertAsync(question);
        await questionRepository.CommitAsync();

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.UserId });
        var askerName = BuildDisplayName(user?.FirstName, user?.LastName, user?.UserName, user?.Email);
        var subjectPreview = string.IsNullOrWhiteSpace(command.Subject)
            ? StripHtml(content, 80)
            : command.Subject!.Trim();

        var adminIds = await questionRepository.GetAdminUserIdsAsync();
        var adminNotifications = adminIds.Select(adminId => UserNotification.Create(
            adminId,
            "New project question",
            $"{askerName} asked about \"{project.Title}\": {subjectPreview}",
            "admin_new_project_question",
            $"/dashboard/project-questions/{question.Id}",
            question.Id)).ToList();

        if (adminNotifications.Count > 0)
            await notificationRepository.InsertManyAsync(adminNotifications);

        await notificationRepository.InsertAsync(UserNotification.Create(
            command.UserId,
            "Question submitted",
            $"Your question about \"{project.Title}\" was submitted and is pending review.",
            "project_question_submitted",
            $"/projects/{project.Slug}",
            question.Id));

        await notificationRepository.CommitAsync();

        await realtimeNotifier.NotifyQuestionSubmittedAsync(question.ProjectId, question.Id, adminIds);
        await realtimeNotifier.NotifyUserNotificationAsync(command.UserId);

        return await OkAsync(question.Id.ToString());
    }

    private static string BuildDisplayName(string? firstName, string? lastName, string? userName, string? email)
    {
        var full = $"{firstName?.Trim() ?? ""} {lastName?.Trim() ?? ""}".Trim();
        if (!string.IsNullOrEmpty(full)) return full;
        if (!string.IsNullOrWhiteSpace(userName)) return userName.Trim();
        return email?.Trim() ?? "A user";
    }

    private static string StripHtml(string html, int maxLen)
    {
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ").Trim();
        if (text.Length <= maxLen) return text;
        return text[..maxLen] + "...";
    }
}
