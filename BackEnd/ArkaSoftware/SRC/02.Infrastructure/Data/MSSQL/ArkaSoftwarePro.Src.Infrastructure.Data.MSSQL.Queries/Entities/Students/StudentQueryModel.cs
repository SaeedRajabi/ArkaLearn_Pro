using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Orders;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Students
{
    public class StudentQueryModel
    {
        public long StudentId { get; set; }

        public long UserId { get; set; }
        public string? HeaderImageUrl { get; set; }

        public UserQueryModel? User { get; set; }

        public List<OrderQueryModel> Orders { get; set; } = new();
    }
}
