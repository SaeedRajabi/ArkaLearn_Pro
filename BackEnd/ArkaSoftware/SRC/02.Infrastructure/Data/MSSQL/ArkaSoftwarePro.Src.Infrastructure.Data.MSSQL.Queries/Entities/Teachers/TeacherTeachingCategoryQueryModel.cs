namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;

public class TeacherTeachingCategoryQueryModel
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}
