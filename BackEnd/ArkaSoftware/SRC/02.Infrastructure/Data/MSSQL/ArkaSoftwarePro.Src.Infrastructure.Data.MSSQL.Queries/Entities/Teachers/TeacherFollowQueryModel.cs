namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;

public class TeacherFollowQueryModel
{
    public long Id { get; set; }
    public long FollowerUserId { get; set; }
    public long TeacherId { get; set; }
}
