using ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices;
using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.SaveExamAnswers;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Commands;

public class SaveExamAnswersCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IExamAttemptCommandRepository examAttemptCommandRepository)
    : CommandHandler<SaveExamAnswers, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(SaveExamAnswers command)
    {
        var attempt = await examAttemptCommandRepository.GetByIdWithAnswersAsync(command.AttemptId);
        if (attempt == null || attempt.UserId != command.UserId)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (attempt.IsLocked)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        if (attempt.ExpiresAtUtc.HasValue && attempt.ExpiresAtUtc <= DateTime.UtcNow)
        {
            AddMessage("Exam time has expired.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var responses = command.Answers.Select(a => (a.QuestionId, a.SelectedOptionIdsJson, a.TextAnswer, a.PasteCount));
        attempt.SaveAnswers(responses);
        await examAttemptCommandRepository.CommitAsync();
        return await OkAsync(attempt.Id.ToString());
    }
}
