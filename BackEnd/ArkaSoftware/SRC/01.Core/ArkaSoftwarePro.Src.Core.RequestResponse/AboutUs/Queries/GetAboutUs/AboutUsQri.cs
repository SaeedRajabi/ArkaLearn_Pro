namespace ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Queries.GetAboutUs
{
    public class AboutUsQri
    {
        public long Id { get; set; }
        public string HeroTitle { get; set; } = string.Empty;
        public string HeroSubtitle { get; set; } = string.Empty;
        public string HeroImageUrl { get; set; } = string.Empty;
        public string IntroTitle { get; set; } = string.Empty;
        public string IntroContentHtml { get; set; } = string.Empty;
        public string MissionTitle { get; set; } = string.Empty;
        public string MissionContentHtml { get; set; } = string.Empty;
        public string VisionTitle { get; set; } = string.Empty;
        public string VisionContentHtml { get; set; } = string.Empty;
        public string ValuesTitle { get; set; } = string.Empty;
        public string ValuesContentHtml { get; set; } = string.Empty;
        public string TeamTitle { get; set; } = string.Empty;
        public string TeamContentHtml { get; set; } = string.Empty;
        public string TeamImageUrl { get; set; } = string.Empty;
        public string CtaTitle { get; set; } = string.Empty;
        public string CtaSubtitle { get; set; } = string.Empty;
        public string CtaButtonText { get; set; } = string.Empty;
        public string CtaButtonUrl { get; set; } = string.Empty;
        public ICollection<AboutUsTeamMemberQri> TeamMembers { get; set; } = new List<AboutUsTeamMemberQri>();
        public DateTime? LastModifiedAt { get; set; }
    }
}
