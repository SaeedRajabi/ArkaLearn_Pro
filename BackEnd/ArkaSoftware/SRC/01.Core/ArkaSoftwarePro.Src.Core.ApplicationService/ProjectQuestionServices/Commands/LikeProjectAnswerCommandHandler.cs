using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.LikeProjectAnswer;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectQuestionServices.Commands;

public class LikeProjectAnswerCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectQuestionCommandRepository questionRepository)
    : CommandHandler<LikeProjectAnswerCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(LikeProjectAnswerCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var answer = await questionRepository.GetAnswerAsync(command.AnswerId);
        if (answer == null)
            return await ResultAsync("Answer not found.", ApplicationServiceStatus.NotFound);

        var alreadyLiked = await questionRepository.HasUserLikedAnswerAsync(command.AnswerId, command.UserId);
        if (alreadyLiked)
        {
            await questionRepository.RemoveAnswerLikeAsync(command.AnswerId, command.UserId);
            answer.DecrementLike();
            await questionRepository.CommitAsync();
            return await OkAsync("unliked");
        }

        await questionRepository.AddAnswerLikeAsync(ProjectAnswerLike.Create(command.AnswerId, command.UserId));
        answer.IncrementLike();
        await questionRepository.CommitAsync();
        return await OkAsync("liked");
    }
}
