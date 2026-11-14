namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;

public class TeacherEducationQueryModel
{
    public long Id { get; set; }
    public string? NameOfInstitutionOrUniversity { get; set; }
    public string? TypeOfDegree { get; set; }
    public string? DegreeImage { get; set; }


    public TeacherQueryModel? Teacher { get; set; }
    public long TeacherId { get; set; }
}