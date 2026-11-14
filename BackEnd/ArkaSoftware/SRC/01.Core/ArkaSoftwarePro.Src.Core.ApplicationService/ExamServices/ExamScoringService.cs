using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices;

public static class ExamScoringService
{
    public static decimal ComputeAutoScore(Exam exam, ExamAttempt attempt)
    {
        decimal total = 0;
        foreach (var question in exam.Questions)
        {
            if (question.QuestionType == ExamQuestionType.ShortAnswer)
                continue;

            var answer = attempt.Answers.FirstOrDefault(a => a.ExamQuestionId == question.Id);
            if (answer == null)
                continue;

            var selectedIds = ParseOptionIds(answer.SelectedOptionIdsJson);
            var correctIds = question.Options.Where(o => o.IsCorrect).Select(o => o.Id).OrderBy(x => x).ToList();
            var selectedSorted = selectedIds.OrderBy(x => x).ToList();

            if (correctIds.SequenceEqual(selectedSorted))
                total += question.Points;
        }

        return total;
    }

    public static void ApplyAutoGrades(Exam exam, ExamAttempt attempt)
    {
        foreach (var question in exam.Questions)
        {
            var answer = attempt.Answers.FirstOrDefault(a => a.ExamQuestionId == question.Id);
            if (answer == null)
                continue;

            if (question.QuestionType == ExamQuestionType.ShortAnswer)
                continue;

            var selectedIds = ParseOptionIds(answer.SelectedOptionIdsJson);
            var correctIds = question.Options.Where(o => o.IsCorrect).Select(o => o.Id).OrderBy(x => x).ToList();
            var selectedSorted = selectedIds.OrderBy(x => x).ToList();
            var points = correctIds.SequenceEqual(selectedSorted) ? question.Points : 0m;
            attempt.SetAnswerGrade(question.Id, points, isAutoGraded: true);
        }

        attempt.ApplyAutoScore(ComputeAutoScore(exam, attempt));
    }

    public static List<long> ParseOptionIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<long>>(json) ?? [];
        }
        catch
        {
            return json.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => long.TryParse(s, out var id) ? id : 0)
                .Where(id => id > 0)
                .ToList();
        }
    }

    public static string ToOptionIdsJson(IEnumerable<long> ids)
        => JsonSerializer.Serialize(ids.Distinct().ToList());
}
