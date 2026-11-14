using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.AboutUsAggregate.Entities
{
    public class AboutUsTeamMember : Entity
    {
        public string FullName { get; private set; } = string.Empty;
        public string SkillTitle { get; private set; } = string.Empty;
        public string ImageUrl { get; private set; } = string.Empty;
        public string GithubUrl { get; private set; } = string.Empty;
        public string LinkedinUrl { get; private set; } = string.Empty;
        public string TwitterUrl { get; private set; } = string.Empty;
        public string InstagramUrl { get; private set; } = string.Empty;
        public string WebsiteUrl { get; private set; } = string.Empty;
        public int DisplayOrder { get; private set; }

        public long AboutUsPageId { get; private set; }
        public AboutUsPage? AboutUsPage { get; private set; }

        private AboutUsTeamMember(
            string fullName,
            string skillTitle,
            string imageUrl,
            string githubUrl,
            string linkedinUrl,
            string twitterUrl,
            string instagramUrl,
            string websiteUrl,
            int displayOrder)
        {
            Update(
                fullName,
                skillTitle,
                imageUrl,
                githubUrl,
                linkedinUrl,
                twitterUrl,
                instagramUrl,
                websiteUrl,
                displayOrder);
        }

        private AboutUsTeamMember()
        {
        }

        public static AboutUsTeamMember Create(
            string fullName,
            string skillTitle,
            string imageUrl,
            string githubUrl,
            string linkedinUrl,
            string twitterUrl,
            string instagramUrl,
            string websiteUrl,
            int displayOrder)
            => new(
                fullName,
                skillTitle,
                imageUrl,
                githubUrl,
                linkedinUrl,
                twitterUrl,
                instagramUrl,
                websiteUrl,
                displayOrder);

        public void Update(
            string fullName,
            string skillTitle,
            string imageUrl,
            string githubUrl,
            string linkedinUrl,
            string twitterUrl,
            string instagramUrl,
            string websiteUrl,
            int displayOrder)
        {
            FullName = fullName?.Trim() ?? string.Empty;
            SkillTitle = skillTitle?.Trim() ?? string.Empty;
            ImageUrl = imageUrl?.Trim() ?? string.Empty;
            GithubUrl = githubUrl?.Trim() ?? string.Empty;
            LinkedinUrl = linkedinUrl?.Trim() ?? string.Empty;
            TwitterUrl = twitterUrl?.Trim() ?? string.Empty;
            InstagramUrl = instagramUrl?.Trim() ?? string.Empty;
            WebsiteUrl = websiteUrl?.Trim() ?? string.Empty;
            DisplayOrder = displayOrder < 0 ? 0 : displayOrder;
        }
    }
}
