using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Commands;

public interface IProjectQuestionCommandRepository : ICommandRepository<ProjectQuestion, long>
{
    Task<ProjectQuestion?> GetWithAnswersAsync(long questionId);
    Task<ProjectAnswer?> GetAnswerAsync(long answerId);
    Task<bool> HasUserLikedAnswerAsync(long answerId, long userId);
    Task AddAnswerLikeAsync(ProjectAnswerLike like);
    Task RemoveAnswerLikeAsync(long answerId, long userId);
    Task<List<long>> GetAdminUserIdsAsync();
}
