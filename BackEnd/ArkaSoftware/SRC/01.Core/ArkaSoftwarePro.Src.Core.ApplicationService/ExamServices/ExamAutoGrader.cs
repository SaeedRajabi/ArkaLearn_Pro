using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices;

public static class ExamAutoGrader
{
    public static decimal GradeAttempt(Exam exam, ExamAttempt attempt)
    {
        decimal total = 0;
        foreach (var question in exam.Questions)
        {
            if (question.QuestionType == ExamQuestionType.ShortAnswer)
                continue;

            var answer = attempt.Answers.FirstOrDefault(a => a.ExamQuestionId == question.Id);
            var selected = ParseOptionIds(answer?.SelectedOptionIdsJson);
            var correct = question.Options.Where(o => o.IsCorrect).Select(o => o.Id).OrderBy(x => x).ToList();
            var selectedSorted = selected.OrderBy(x => x).ToList();

            var points = selectedSorted.SequenceEqual(correct) ? question.Points : 0m;
            attempt.SetAnswerGrade(question.Id, points, true);
            total += points;
        }

        attempt.ApplyAutoScore(total);
        return total;
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

    public static string SerializeOptionIds(IEnumerable<long> ids)
        => JsonSerializer.Serialize(ids.Distinct().ToList());
}
