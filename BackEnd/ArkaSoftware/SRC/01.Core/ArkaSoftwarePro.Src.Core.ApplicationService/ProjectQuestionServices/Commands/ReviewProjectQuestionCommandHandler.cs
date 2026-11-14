using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.ReviewProjectQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectQuestionServices.Commands;

public class ReviewProjectQuestionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectQuestionCommandRepository questionRepository,
    IProjectQueriesRepository projectQueriesRepository,
    IUserNotificationCommandRepository notificationRepository,
    IProjectQaRealtimeNotifier realtimeNotifier)
    : CommandHandler<ReviewProjectQuestionCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ReviewProjectQuestionCommand command)
    {
        var question = await questionRepository.GetWithAnswersAsync(command.QuestionId);
        if (question == null)
            return await ResultAsync("Question not found.", ApplicationServiceStatus.NotFound);

        if (question.Status != ProjectQuestionStatus.Pending)
        {
            AddMessage("This question has already been reviewed.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var status = command.Approve ? ProjectQuestionStatus.Approved : ProjectQuestionStatus.Rejected;
        question.Review(status, command.ReviewerUserId);
        await questionRepository.CommitAsync();

        var project = await projectQueriesRepository.GetProjectByIdExecuteAsync(
            new GetProjectByIdQuery { ProjectId = question.ProjectId });

        var title = command.Approve ? "Question approved" : "Question not approved";
        var body = command.Approve
            ? $"Your question about \"{project?.Title ?? "the project"}\" is now visible to everyone."
            : $"Your question about \"{project?.Title ?? "the project"}\" was not approved.";

        await notificationRepository.InsertAsync(UserNotification.Create(
            question.UserId,
            title,
            body,
            command.Approve ? "project_question_approved" : "project_question_rejected",
            $"/projects/{project?.Slug ?? question.ProjectId.ToString()}",
            question.Id));

        await notificationRepository.CommitAsync();

        await realtimeNotifier.NotifyQuestionReviewedAsync(
            question.ProjectId,
            question.Id,
            question.UserId,
            command.Approve);

        return await OkAsync(command.Approve ? "Question approved." : "Question rejected.");
    }
}
