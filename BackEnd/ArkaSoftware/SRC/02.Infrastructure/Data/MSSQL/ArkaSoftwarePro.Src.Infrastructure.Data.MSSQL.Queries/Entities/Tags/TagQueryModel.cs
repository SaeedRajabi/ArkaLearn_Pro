using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Articles;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Projects;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Tags
{
    public class TagQueryModel
    {
        public long Id { get; set; }
        public string? TagName { get; set; }

        public ArticleQueryModel? Article { get; set; }
        public long? ArticleId { get; set; }

        public CourseQueryModel? Course { get; set; }
        public long? CourseId { get; set; }

        public SeminarQueryModel? Seminar { get; set; }
        public long? SeminarId { get; set; }

        public ProjectQueryModel? Project { get; set; }
        public long? ProjectId { get; set; }
    }
}
