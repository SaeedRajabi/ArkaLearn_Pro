namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

public class IPBlacklistQueryModel
{
    public long Id { get; set; }
    public string? IPAddress { get; set; }
    public string? DeviceInformation { get; set; }
    public string? Reason { get; set; }
    public DateTime AddedDate { get; set; }
    public DateTime ExpirationDate { get; set; }
    public bool IsDelete { get; set; }
}
