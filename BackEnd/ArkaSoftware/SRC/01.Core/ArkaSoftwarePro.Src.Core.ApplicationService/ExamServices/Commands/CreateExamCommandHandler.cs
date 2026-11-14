using ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices;
using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Exams.QuestionBankRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.CreateExam;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices.Commands;

public class CreateExamCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IExamCommandRepository examCommandRepository,
    IExamAttemptCommandRepository examAttemptCommandRepository,
    IExamQueriesRepository examQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IBankQuestionCommandRepository bankQuestionCommandRepository,
    ExamNotifier examNotifier)
    : CommandHandler<CreateExam, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(CreateExam command)
    {
        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(command.TeacherUserId);
        if (!teacherId.HasValue)
        {
            AddMessage("Teacher not found.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
        }

        if (!await examQueriesRepository.IsCourseOwnedByTeacherAsync(command.CourseId, teacherId.Value))
        {
            AddMessage("Course not found or access denied.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
        }

        if (command.EndsAtUtc <= DateTime.UtcNow)
        {
            AddMessage("Exam end date must be in the future.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var eligibleStudents = await examQueriesRepository.GetCourseStudentsAsync(command.CourseId, teacherId.Value);
        var selectedIds = command.StudentIds.Distinct().ToList();
        var assignments = new List<ExamAssignment>();

        // Students whose enrollment went inactive between picking and saving are
        // skipped; failing the whole exam for one stale enrollment is worse than
        // assigning to the students who are actually enrolled.
        foreach (var studentId in selectedIds)
        {
            var student = eligibleStudents.FirstOrDefault(s => s.StudentId == studentId);
            if (student == null)
                continue;

            assignments.Add(ExamAssignment.Create(student.StudentId, student.UserId));
        }

        if (selectedIds.Count > 0 && assignments.Count == 0)
        {
            AddMessage("None of the selected students is currently enrolled in this course.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var requestedBankIds = command.Questions
            .Where(q => q.BankQuestionId is > 0)
            .Select(q => q.BankQuestionId!.Value)
            .Distinct()
            .ToList();
        var bankById = (await bankQuestionCommandRepository.GetByIdsWithOptionsAsync(requestedBankIds))
            .ToDictionary(b => b.Id);

        var questions = new List<ExamQuestion>();
        var touchedBankIds = new HashSet<long>();

        foreach (var q in command.Questions.OrderBy(x => x.OrderIndex))
        {
            ExamQuestion examQuestion;
            if (q.BankQuestionId is > 0)
            {
                if (!bankById.TryGetValue(q.BankQuestionId.Value, out var bank))
                {
                    AddMessage($"Bank question {q.BankQuestionId} was not found.");
                    return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
                }

                examQuestion = ExamQuestion.Create(
                    q.OrderIndex,
                    bank.QuestionType,
                    bank.Prompt,
                    q.Points > 0 ? q.Points : bank.DefaultPoints,
                    bank.Options.OrderBy(o => o.OrderIndex).Select(o => (o.Text, o.IsCorrect)),
                    bank.CodeSnippet,
                    bank.CodeLanguage,
                    bank.Id);

                touchedBankIds.Add(bank.Id);
            }
            else
            {
                var questionType = (ExamQuestionType)q.QuestionType;
                var options = q.Options.Select(o => (o.Text, o.IsCorrect)).ToList();
                var hash = BankQuestion.ComputeContentHashFromDraft(questionType, q.Prompt, q.CodeSnippet, options);
                var existing = await bankQuestionCommandRepository.FindActiveByContentHashAsync(hash);
                BankQuestion bank;
                if (existing != null)
                {
                    bank = existing;
                }
                else
                {
                    bank = BankQuestion.Create(
                        questionType,
                        q.Prompt,
                        q.Points,
                        command.TeacherUserId,
                        teacherId.Value,
                        options,
                        q.CodeSnippet,
                        q.CodeLanguage,
                        q.Category,
                        q.Topic,
                        q.Tags,
                        command.CourseId);
                    await bankQuestionCommandRepository.InsertAsync(bank);
                    await bankQuestionCommandRepository.CommitAsync();
                }

                examQuestion = ExamQuestion.Create(
                    q.OrderIndex,
                    questionType,
                    q.Prompt,
                    q.Points,
                    options,
                    q.CodeSnippet,
                    q.CodeLanguage,
                    bank.Id);

                touchedBankIds.Add(bank.Id);
            }

            questions.Add(examQuestion);
        }

        var exam = Exam.Create(
            command.Title,
            command.Description,
            command.CourseId,
            teacherId.Value,
            command.Level,
            command.EndsAtUtc,
            command.DurationMinutes,
            questions,
            assignments,
            command.AllowPaste);

        await examCommandRepository.InsertAsync(exam);
        await examCommandRepository.CommitAsync();

        if (touchedBankIds.Count > 0)
        {
            var banks = await bankQuestionCommandRepository.GetByIdsWithOptionsAsync(touchedBankIds);
            foreach (var bank in banks)
                bank.IncrementUsage();
            await bankQuestionCommandRepository.CommitAsync();
        }

        var questionIds = exam.Questions.Select(q => q.Id).ToList();
        var pendingAttempts = new List<(ExamAttempt Attempt, long UserId)>();
        foreach (var assignment in exam.Assignments)
        {
            var attempt = ExamAttempt.CreatePending(exam.Id, assignment.StudentId, assignment.UserId, questionIds);
            await examAttemptCommandRepository.InsertAsync(attempt);
            pendingAttempts.Add((attempt, assignment.UserId));
        }

        await examAttemptCommandRepository.CommitAsync();

        foreach (var (attempt, userId) in pendingAttempts)
            await examNotifier.NotifyExamAssignedAsync(
                userId,
                exam.Title,
                exam.Description ?? string.Empty,
                exam.Level,
                exam.EndsAtUtc,
                exam.DurationMinutes,
                command.TeacherUserId,
                exam.Id,
                attempt.Id);

        return await OkAsync(exam.Id.ToString());
    }
}
