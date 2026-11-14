namespace ArkaSoftwarePro.Src.Core.Contracts.Teachers;

public sealed record TeacherAdvertisementModerationInput(
    string Title,
    string WorkExperience,
    string DescriptionHtml,
    IReadOnlyList<string> Tags);

public sealed record TeacherAdvertisementModerationResult(
    bool IsAllowed,
    string Reason);

public interface ITeacherAdvertisementContentModerator
{
    Task<TeacherAdvertisementModerationResult> EvaluateAsync(
        TeacherAdvertisementModerationInput input,
        CancellationToken cancellationToken = default);
}
