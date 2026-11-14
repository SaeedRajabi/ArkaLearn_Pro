using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherTeachingCategories;

public class GetTeacherTeachingCategoriesQuery : IQuery<List<TeacherTeachingCategoryItemQri>>, IWebRequest
{
    public string Path => "api/Service/Teacher/GetTeachingCategories";
}

public class TeacherTeachingCategoryItemQri
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
}
