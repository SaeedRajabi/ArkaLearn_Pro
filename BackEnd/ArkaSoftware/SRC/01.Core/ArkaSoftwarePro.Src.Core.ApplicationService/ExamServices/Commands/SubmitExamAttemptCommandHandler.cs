using ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.QuestionBankServices;
using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.SubmitExamAttempt;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Commands;

public class SubmitExamAttemptCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IExamCommandRepository examCommandRepository,
    IExamAttemptCommandRepository examAttemptCommandRepository,
    IExamQueriesRepository examQueriesRepository,
    ExamNotifier examNotifier,
    QuestionBankStatsService questionBankStatsService)
    : CommandHandler<SubmitExamAttempt, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(SubmitExamAttempt command)
    {
        var attempt = await examAttemptCommandRepository.GetByIdWithAnswersAsync(command.AttemptId);
        if (attempt == null || attempt.UserId != command.UserId)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (attempt.IsLocked)
            return await ResultAsync(attempt.Id.ToString(), ApplicationServiceStatus.Ok);

        var responses = command.Answers.Select(a => (a.QuestionId, a.SelectedOptionIdsJson, a.TextAnswer, a.PasteCount));
        if (command.Answers.Count > 0)
            attempt.SaveAnswers(responses);

        var exam = await examCommandRepository.GetByIdWithDetailsAsync(attempt.ExamId);
        if (exam == null)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        attempt.Submit();
        ExamScoringService.ApplyAutoGrades(exam, attempt);
        await examAttemptCommandRepository.CommitAsync();

        await questionBankStatsService.RecordAttemptGradesAsync(
            exam,
            attempt.Answers.Select(a => (a.ExamQuestionId, a.PointsAwarded)));

        var teacherUserId = await examNotifier.ResolveTeacherUserIdAsync(exam.TeacherId);
        if (teacherUserId.HasValue)
        {
            var grading = await examQueriesRepository.GetAttemptForGradingAsync(attempt.Id, exam.TeacherId);
            await examNotifier.NotifyExamSubmittedAsync(
                teacherUserId.Value,
                exam.Title,
                grading?.StudentName ?? "Student",
                exam.Id,
                attempt.Id,
                attempt.StartedAtUtc,
                attempt.SubmittedAtUtc,
                exam.DurationMinutes,
                exam.Questions.Count);
        }

        return await OkAsync(attempt.Id.ToString());
    }
}
