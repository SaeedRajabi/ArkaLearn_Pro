namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.UserNotifications;

public class UserNotificationQueryModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public long? RelatedEntityId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedDateTime { get; set; }
    public bool IsDelete { get; set; }
}
