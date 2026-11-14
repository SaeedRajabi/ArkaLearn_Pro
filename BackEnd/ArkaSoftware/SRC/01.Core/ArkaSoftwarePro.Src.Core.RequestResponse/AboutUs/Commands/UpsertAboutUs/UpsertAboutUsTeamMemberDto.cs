using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Commands.UpsertAboutUs
{
    public class UpsertAboutUsTeamMemberDto
    {
        public string FullName { get; set; } = string.Empty;
        public string SkillTitle { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public IFormFile? ImageFile { get; set; }
        public string? GithubUrl { get; set; }
        public string? LinkedinUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public int DisplayOrder { get; set; }
    }
}
