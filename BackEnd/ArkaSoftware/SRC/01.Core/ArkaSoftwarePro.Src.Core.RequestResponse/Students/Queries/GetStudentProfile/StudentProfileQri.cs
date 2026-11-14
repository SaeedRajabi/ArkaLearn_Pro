namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetStudentProfile;

public class StudentProfileQri
{
    public long StudentId { get; set; }
    public long UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string HeaderImageUrl { get; set; } = string.Empty;
}
