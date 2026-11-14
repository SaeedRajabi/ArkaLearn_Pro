namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.MediaUploadSettings;

public class MediaUploadSettingsQueryModel
{
    public long Id { get; set; }
    public int CourseIntroMaxDurationMinutes { get; set; } = 5;
    public int PromotionalVideoMaxDurationMinutes { get; set; } = 5;
}
