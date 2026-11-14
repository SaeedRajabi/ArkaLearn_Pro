namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.AboutUs
{
    public class AboutUsTeamMemberQueryModel
    {
        public long Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string SkillTitle { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string GithubUrl { get; set; } = string.Empty;
        public string LinkedinUrl { get; set; } = string.Empty;
        public string TwitterUrl { get; set; } = string.Empty;
        public string InstagramUrl { get; set; } = string.Empty;
        public string WebsiteUrl { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }

        public long AboutUsPageId { get; set; }
        public AboutUsPageQueryModel AboutUsPage { get; set; } = null!;
    }
}
