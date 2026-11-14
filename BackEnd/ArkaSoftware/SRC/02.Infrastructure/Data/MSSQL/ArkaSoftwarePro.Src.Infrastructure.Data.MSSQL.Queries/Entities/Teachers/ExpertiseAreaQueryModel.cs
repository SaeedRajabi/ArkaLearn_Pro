namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;

public class ExpertiseAreaQueryModel
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Rate { get; set; }



    public TeacherQueryModel? Teacher { get; set; }
    public long TeacherId { get; set; }
}