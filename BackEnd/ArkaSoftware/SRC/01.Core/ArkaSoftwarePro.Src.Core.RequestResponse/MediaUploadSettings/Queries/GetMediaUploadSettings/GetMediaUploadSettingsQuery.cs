using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaUploadSettings.Queries.GetMediaUploadSettings;

public class GetMediaUploadSettingsQuery : IQuery<MediaUploadSettingsQri>, IWebRequest
{
    public string Path => "/api/Service/MediaUploadSettings/Get";
}

public class MediaUploadSettingsQri
{
    public int CourseIntroMaxDurationMinutes { get; set; } = 5;
    public int PromotionalVideoMaxDurationMinutes { get; set; } = 5;
}
