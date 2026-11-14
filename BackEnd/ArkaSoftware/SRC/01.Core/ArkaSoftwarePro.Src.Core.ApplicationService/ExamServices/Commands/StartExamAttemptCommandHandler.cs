using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.StartExamAttempt;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Commands;

public class StartExamAttemptCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IExamCommandRepository examCommandRepository,
    IExamAttemptCommandRepository examAttemptCommandRepository,
    IExamQueriesRepository examQueriesRepository)
    : CommandHandler<StartExamAttempt, StartExamAttemptResult>(mafiaOuterServices)
{
    public override async Task<CommandResult<StartExamAttemptResult>> Handle(StartExamAttempt command)
    {
        var studentId = await examQueriesRepository.GetStudentIdByUserIdAsync(command.UserId);
        if (!studentId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var exam = await examCommandRepository.GetByIdWithDetailsAsync(command.ExamId);
        if (exam == null || exam.EndsAtUtc <= DateTime.UtcNow)
        {
            AddMessage("Exam not available.");
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        }

        if (!await examQueriesRepository.IsStudentAssignedAsync(command.ExamId, studentId.Value))
        {
            AddMessage("You are not assigned to this exam.");
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        }

        var attempt = await examAttemptCommandRepository.GetByExamAndStudentAsync(command.ExamId, studentId.Value);
        if (attempt == null)
        {
            // Legacy / partial assignment: create pending attempt on first start.
            var questionIds = exam.Questions.Select(q => q.Id).ToList();
            attempt = ExamAttempt.CreatePending(command.ExamId, studentId.Value, command.UserId, questionIds);
            await examAttemptCommandRepository.InsertAsync(attempt);
            await examAttemptCommandRepository.CommitAsync();
        }

        if (attempt.IsLocked)
        {
            AddMessage("Exam attempt is locked.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        if (attempt.Status == ExamAttemptStatus.InProgress)
        {
            return await OkAsync(new StartExamAttemptResult
            {
                AttemptId = attempt.Id,
                ExpiresAtUtc = attempt.ExpiresAtUtc!.Value,
            });
        }

        attempt.Start(exam.DurationMinutes, exam.EndsAtUtc);
        await examAttemptCommandRepository.CommitAsync();

        return await OkAsync(new StartExamAttemptResult
        {
            AttemptId = attempt.Id,
            ExpiresAtUtc = attempt.ExpiresAtUtc!.Value,
        });
    }
}
