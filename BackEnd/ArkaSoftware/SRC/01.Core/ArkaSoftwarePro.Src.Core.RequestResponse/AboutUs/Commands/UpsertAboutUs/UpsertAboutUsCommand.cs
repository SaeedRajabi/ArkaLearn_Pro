using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Commands.UpsertAboutUs
{
    public class UpsertAboutUsCommand : ICommand<string>, IWebRequest
    {
        public string HeroTitle { get; set; } = string.Empty;
        public string HeroSubtitle { get; set; } = string.Empty;
        public string? HeroImageUrl { get; set; }
        public IFormFile? HeroImageFile { get; set; }

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
        public string? TeamImageUrl { get; set; }
        public IFormFile? TeamImageFile { get; set; }

        public string CtaTitle { get; set; } = string.Empty;
        public string CtaSubtitle { get; set; } = string.Empty;
        public string CtaButtonText { get; set; } = string.Empty;
        public string CtaButtonUrl { get; set; } = string.Empty;
        public List<UpsertAboutUsTeamMemberDto> TeamMembers { get; set; } = [];

        public string Path => "api/Service/AboutUs/Upsert";
    }
}
