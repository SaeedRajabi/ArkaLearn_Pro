using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.ProjectOrders;

public class ProjectOrderQueryModel
{
    public long Id { get; set; }
    public int RequestNumber { get; set; }
    public long? UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ProjectType { get; set; } = string.Empty;
    public string? DescriptionHtml { get; set; }
    public ProjectOrderStatus Status { get; set; }
    public string? AdminNote { get; set; }
    public long? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedDateTime { get; set; }
    public bool IsDelete { get; set; }

    public UserQueryModel? User { get; set; }
    public UserQueryModel? ReviewedByUser { get; set; }
}
