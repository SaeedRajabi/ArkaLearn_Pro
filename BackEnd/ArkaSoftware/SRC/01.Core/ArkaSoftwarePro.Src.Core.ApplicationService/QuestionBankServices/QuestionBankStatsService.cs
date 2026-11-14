using ArkaSoftwarePro.Src.Core.Contracts.Exams.QuestionBankRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.QuestionBankServices;

public sealed class QuestionBankStatsService(IBankQuestionCommandRepository bankQuestionCommandRepository)
{
    public async Task RecordAttemptGradesAsync(Exam exam, IEnumerable<(long ExamQuestionId, decimal? PointsAwarded)> grades)
    {
        var gradeMap = grades
            .Where(g => g.PointsAwarded.HasValue)
            .ToDictionary(g => g.ExamQuestionId, g => g.PointsAwarded!.Value);

        var bankIds = exam.Questions
            .Where(q => q.BankQuestionId.HasValue && gradeMap.ContainsKey(q.Id))
            .Select(q => q.BankQuestionId!.Value)
            .Distinct()
            .ToList();

        if (bankIds.Count == 0)
            return;

        var banks = await bankQuestionCommandRepository.GetByIdsWithOptionsAsync(bankIds);
        var bankById = banks.ToDictionary(b => b.Id);

        foreach (var question in exam.Questions)
        {
            if (!question.BankQuestionId.HasValue)
                continue;
            if (!gradeMap.TryGetValue(question.Id, out var pointsAwarded))
                continue;
            if (!bankById.TryGetValue(question.BankQuestionId.Value, out var bank))
                continue;

            var wasCorrect = pointsAwarded >= question.Points;
            bank.RecordGradedAnswer(wasCorrect);
        }

        await bankQuestionCommandRepository.CommitAsync();
    }
}
