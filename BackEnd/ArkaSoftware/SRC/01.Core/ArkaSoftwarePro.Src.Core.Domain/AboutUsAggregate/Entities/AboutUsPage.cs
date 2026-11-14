using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.AboutUsAggregate.Entities
{
    public class AboutUsPage : AggregateRoot
    {
        private readonly List<AboutUsTeamMember> _teamMembers = new();

        public string HeroTitle { get; private set; } = string.Empty;
        public string HeroSubtitle { get; private set; } = string.Empty;
        public string HeroImageUrl { get; private set; } = string.Empty;
        public string IntroTitle { get; private set; } = string.Empty;
        public string IntroContentHtml { get; private set; } = string.Empty;
        public string MissionTitle { get; private set; } = string.Empty;
        public string MissionContentHtml { get; private set; } = string.Empty;
        public string VisionTitle { get; private set; } = string.Empty;
        public string VisionContentHtml { get; private set; } = string.Empty;
        public string ValuesTitle { get; private set; } = string.Empty;
        public string ValuesContentHtml { get; private set; } = string.Empty;
        public string TeamTitle { get; private set; } = string.Empty;
        public string TeamContentHtml { get; private set; } = string.Empty;
        public string TeamImageUrl { get; private set; } = string.Empty;
        public string CtaTitle { get; private set; } = string.Empty;
        public string CtaSubtitle { get; private set; } = string.Empty;
        public string CtaButtonText { get; private set; } = string.Empty;
        public string CtaButtonUrl { get; private set; } = string.Empty;
        public IEnumerable<AboutUsTeamMember> TeamMembers => _teamMembers.AsReadOnly();

        public AboutUsPage(
            string heroTitle,
            string heroSubtitle,
            string heroImageUrl,
            string introTitle,
            string introContentHtml,
            string missionTitle,
            string missionContentHtml,
            string visionTitle,
            string visionContentHtml,
            string valuesTitle,
            string valuesContentHtml,
            string teamTitle,
            string teamContentHtml,
            string teamImageUrl,
            string ctaTitle,
            string ctaSubtitle,
            string ctaButtonText,
            string ctaButtonUrl)
        {
            Update(
                heroTitle,
                heroSubtitle,
                heroImageUrl,
                introTitle,
                introContentHtml,
                missionTitle,
                missionContentHtml,
                visionTitle,
                visionContentHtml,
                valuesTitle,
                valuesContentHtml,
                teamTitle,
                teamContentHtml,
                teamImageUrl,
                ctaTitle,
                ctaSubtitle,
                ctaButtonText,
                ctaButtonUrl);
        }

        private AboutUsPage()
        {
        }

        public void Update(
            string heroTitle,
            string heroSubtitle,
            string heroImageUrl,
            string introTitle,
            string introContentHtml,
            string missionTitle,
            string missionContentHtml,
            string visionTitle,
            string visionContentHtml,
            string valuesTitle,
            string valuesContentHtml,
            string teamTitle,
            string teamContentHtml,
            string teamImageUrl,
            string ctaTitle,
            string ctaSubtitle,
            string ctaButtonText,
            string ctaButtonUrl)
        {
            HeroTitle = heroTitle?.Trim() ?? string.Empty;
            HeroSubtitle = heroSubtitle?.Trim() ?? string.Empty;
            HeroImageUrl = heroImageUrl?.Trim() ?? string.Empty;
            IntroTitle = introTitle?.Trim() ?? string.Empty;
            IntroContentHtml = introContentHtml ?? string.Empty;
            MissionTitle = missionTitle?.Trim() ?? string.Empty;
            MissionContentHtml = missionContentHtml ?? string.Empty;
            VisionTitle = visionTitle?.Trim() ?? string.Empty;
            VisionContentHtml = visionContentHtml ?? string.Empty;
            ValuesTitle = valuesTitle?.Trim() ?? string.Empty;
            ValuesContentHtml = valuesContentHtml ?? string.Empty;
            TeamTitle = teamTitle?.Trim() ?? string.Empty;
            TeamContentHtml = teamContentHtml ?? string.Empty;
            TeamImageUrl = teamImageUrl?.Trim() ?? string.Empty;
            CtaTitle = ctaTitle?.Trim() ?? string.Empty;
            CtaSubtitle = ctaSubtitle?.Trim() ?? string.Empty;
            CtaButtonText = ctaButtonText?.Trim() ?? string.Empty;
            CtaButtonUrl = ctaButtonUrl?.Trim() ?? string.Empty;
        }

        public void ReplaceTeamMembers(IEnumerable<AboutUsTeamMember>? teamMembers)
        {
            _teamMembers.Clear();

            if (teamMembers == null)
                return;

            foreach (var teamMember in teamMembers.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Id))
            {
                _teamMembers.Add(teamMember);
            }
        }
    }
}
