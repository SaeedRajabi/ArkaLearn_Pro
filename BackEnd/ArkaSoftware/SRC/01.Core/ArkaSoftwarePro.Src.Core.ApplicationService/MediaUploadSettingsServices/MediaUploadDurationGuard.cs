using ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Commands;
using MediaUploadSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.MediaUploadSettingsAggregate.Entities.MediaUploadSettings;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaUploadSettingsServices;

public static class MediaUploadDurationGuard
{
    public static async Task<int> GetCourseIntroLimitAsync(
        IMediaUploadSettingsCommandRepository repository,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = await repository.GetCurrentAsync(cancellationToken);
            return settings?.CourseIntroMaxDurationSeconds
                ?? MediaUploadSettingsEntity.DefaultCourseIntroMaxDurationMinutes * 60;
        }
        catch (Exception ex) when (IsMissingSettingsTable(ex))
        {
            return MediaUploadSettingsEntity.DefaultCourseIntroMaxDurationMinutes * 60;
        }
    }

    public static async Task<int> GetPromotionalLimitAsync(
        IMediaUploadSettingsCommandRepository repository,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = await repository.GetCurrentAsync(cancellationToken);
            return settings?.PromotionalVideoMaxDurationSeconds
                ?? MediaUploadSettingsEntity.DefaultPromotionalVideoMaxDurationMinutes * 60;
        }
        catch (Exception ex) when (IsMissingSettingsTable(ex))
        {
            return MediaUploadSettingsEntity.DefaultPromotionalVideoMaxDurationMinutes * 60;
        }
    }

    public static bool TryResolveDuration(
        int? durationSeconds,
        int maxSeconds,
        out TimeSpan duration,
        out string? error,
        TimeSpan? existingDuration = null)
    {
        if (durationSeconds is > 0)
        {
            if (durationSeconds.Value > maxSeconds)
            {
                duration = default;
                error = $"Video duration cannot exceed {Math.Ceiling(maxSeconds / 60d):0} minutes.";
                return false;
            }

            duration = TimeSpan.FromSeconds(durationSeconds.Value);
            error = null;
            return true;
        }

        if (existingDuration is { } existing && existing > TimeSpan.Zero)
        {
            duration = existing;
            error = null;
            return true;
        }

        duration = TimeSpan.FromSeconds(maxSeconds);
        error = null;
        return true;
    }

    private static bool IsMissingSettingsTable(Exception ex)
    {
        for (var current = ex; current != null; current = current.InnerException)
        {
            var message = current.Message ?? string.Empty;
            if (message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
                && message.Contains("MediaUploadSettings", StringComparison.OrdinalIgnoreCase))
                return true;
            if (message.Contains("MediaUploadSettings", StringComparison.OrdinalIgnoreCase)
                && (message.Contains("does not exist", StringComparison.OrdinalIgnoreCase)
                    || message.Contains("couldn't be found", StringComparison.OrdinalIgnoreCase)))
                return true;
        }

        return false;
    }
}
