using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaUploadSettings.Commands.UpsertMediaUploadSettings;

public class UpsertMediaUploadSettingsCommand : ICommand<string>, IWebRequest
{
    public int CourseIntroMaxDurationMinutes { get; set; } = 5;
    public int PromotionalVideoMaxDurationMinutes { get; set; } = 5;
    public string Path => "/api/Service/MediaUploadSettings/Upsert";
}
