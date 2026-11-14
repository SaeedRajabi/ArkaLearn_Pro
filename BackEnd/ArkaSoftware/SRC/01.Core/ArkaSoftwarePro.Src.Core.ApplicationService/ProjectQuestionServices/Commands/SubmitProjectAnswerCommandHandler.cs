using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.SubmitProjectAnswer;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectQuestionServices.Commands;

public class SubmitProjectAnswerCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectQuestionCommandRepository questionRepository,
    IProjectQueriesRepository projectQueriesRepository,
    IUserNotificationCommandRepository notificationRepository,
    IProjectQaRealtimeNotifier realtimeNotifier)
    : CommandHandler<SubmitProjectAnswerCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SubmitProjectAnswerCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var question = await questionRepository.GetWithAnswersAsync(command.QuestionId);
        if (question == null)
            return await ResultAsync("Question not found.", ApplicationServiceStatus.NotFound);

        if (question.Status != ProjectQuestionStatus.Approved)
        {
            AddMessage("This question is not open for answers.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var adminIds = await questionRepository.GetAdminUserIdsAsync();
        if (!adminIds.Contains(command.UserId))
        {
            AddMessage("Only administrators can answer project questions.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var content = command.ContentHtml ?? string.Empty;
        if (content.Replace("<p></p>", "").Trim().Length < 5 && string.IsNullOrWhiteSpace(command.AudioUrl))
        {
            AddMessage("Answer content is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var answer = question.AddAnswer(command.UserId, content, command.AudioUrl);
        await questionRepository.CommitAsync();

        if (question.UserId != command.UserId)
        {
            var project = await projectQueriesRepository.GetProjectByIdExecuteAsync(
                new GetProjectByIdQuery { ProjectId = question.ProjectId });

            await notificationRepository.InsertAsync(UserNotification.Create(
                question.UserId,
                "Your question was answered",
                $"Administrator answered your question about \"{project?.Title ?? "a project"}\".",
                "project_question_answered",
                $"/projects/{project?.Slug ?? question.ProjectId.ToString()}#qa-{question.Id}",
                question.Id));

            await notificationRepository.CommitAsync();
        }

        await realtimeNotifier.NotifyAnswerPostedAsync(question.ProjectId, question.Id, question.UserId);

        return await OkAsync(answer.Id.ToString());
    }
}
