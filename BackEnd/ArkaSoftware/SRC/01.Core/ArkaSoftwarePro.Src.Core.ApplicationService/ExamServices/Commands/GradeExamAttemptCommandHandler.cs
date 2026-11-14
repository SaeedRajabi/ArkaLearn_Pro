using ArkaSoftwarePro.Src.Core.ApplicationService.QuestionBankServices;
using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.GradeExamAttempt;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Commands;

public class GradeExamAttemptCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IExamAttemptCommandRepository examAttemptCommandRepository,
    IExamCommandRepository examCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    ExamNotifier examNotifier,
    QuestionBankStatsService questionBankStatsService)
    : CommandHandler<GradeExamAttempt, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(GradeExamAttempt command)
    {
        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(command.TeacherUserId);
        if (!teacherId.HasValue)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var attempt = await examAttemptCommandRepository.GetByIdWithAnswersAsync(command.AttemptId);
        if (attempt == null)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var exam = await examCommandRepository.GetByIdWithDetailsAsync(attempt.ExamId);
        if (exam == null || exam.TeacherId != teacherId.Value)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var shortAnswerGrades = new List<(long ExamQuestionId, decimal? PointsAwarded)>();
        foreach (var grade in command.QuestionGrades)
        {
            var question = exam.Questions.FirstOrDefault(q => q.Id == grade.QuestionId);
            if (question == null)
                continue;

            if (question.QuestionType == ExamQuestionType.ShortAnswer)
            {
                attempt.SetAnswerGrade(grade.QuestionId, grade.PointsAwarded, isAutoGraded: false);
                shortAnswerGrades.Add((grade.QuestionId, grade.PointsAwarded));
            }
        }

        attempt.Grade(command.FinalScore, command.ProfessorFeedback);
        await examAttemptCommandRepository.CommitAsync();

        if (shortAnswerGrades.Count > 0)
            await questionBankStatsService.RecordAttemptGradesAsync(exam, shortAnswerGrades);

        await examNotifier.NotifyExamGradedAsync(attempt.UserId, exam.Title, command.FinalScore, attempt.Id);
        return await OkAsync(attempt.Id.ToString());
    }
}
