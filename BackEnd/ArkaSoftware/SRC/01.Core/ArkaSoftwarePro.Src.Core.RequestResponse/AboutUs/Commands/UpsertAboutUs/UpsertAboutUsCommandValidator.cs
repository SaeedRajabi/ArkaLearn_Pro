using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Commands.UpsertAboutUs
{
    public class UpsertAboutUsCommandValidator : AbstractValidator<UpsertAboutUsCommand>
    {
        public UpsertAboutUsCommandValidator(ITranslator translator)
        {
            RuleFor(x => x.HeroTitle)
                .MaximumLength(200).WithMessage(translator["MaximumLength", "HeroTitle", "200"]);

            RuleFor(x => x.HeroSubtitle)
                .MaximumLength(500).WithMessage(translator["MaximumLength", "HeroSubtitle", "500"]);

            RuleFor(x => x.IntroTitle)
                .MaximumLength(200).WithMessage(translator["MaximumLength", "IntroTitle", "200"]);

            RuleFor(x => x.MissionTitle)
                .MaximumLength(200).WithMessage(translator["MaximumLength", "MissionTitle", "200"]);

            RuleFor(x => x.VisionTitle)
                .MaximumLength(200).WithMessage(translator["MaximumLength", "VisionTitle", "200"]);

            RuleFor(x => x.ValuesTitle)
                .MaximumLength(200).WithMessage(translator["MaximumLength", "ValuesTitle", "200"]);

            RuleFor(x => x.TeamTitle)
                .MaximumLength(200).WithMessage(translator["MaximumLength", "TeamTitle", "200"]);

            RuleFor(x => x.CtaTitle)
                .MaximumLength(200).WithMessage(translator["MaximumLength", "CtaTitle", "200"]);

            RuleFor(x => x.CtaSubtitle)
                .MaximumLength(500).WithMessage(translator["MaximumLength", "CtaSubtitle", "500"]);

            RuleFor(x => x.CtaButtonText)
                .MaximumLength(200).WithMessage(translator["MaximumLength", "CtaButtonText", "200"]);

            RuleFor(x => x.CtaButtonUrl)
                .MaximumLength(500).WithMessage(translator["MaximumLength", "CtaButtonUrl", "500"]);

            RuleForEach(x => x.TeamMembers).ChildRules(teamMember =>
            {
                teamMember.RuleFor(x => x.FullName)
                    .MaximumLength(200).WithMessage(translator["MaximumLength", "FullName", "200"]);

                teamMember.RuleFor(x => x.SkillTitle)
                    .MaximumLength(200).WithMessage(translator["MaximumLength", "SkillTitle", "200"]);

                teamMember.RuleFor(x => x.ImageUrl)
                    .MaximumLength(600).WithMessage(translator["MaximumLength", "ImageUrl", "600"]);

                teamMember.RuleFor(x => x.GithubUrl)
                    .MaximumLength(600).WithMessage(translator["MaximumLength", "GithubUrl", "600"]);

                teamMember.RuleFor(x => x.LinkedinUrl)
                    .MaximumLength(600).WithMessage(translator["MaximumLength", "LinkedinUrl", "600"]);

                teamMember.RuleFor(x => x.TwitterUrl)
                    .MaximumLength(600).WithMessage(translator["MaximumLength", "TwitterUrl", "600"]);

                teamMember.RuleFor(x => x.InstagramUrl)
                    .MaximumLength(600).WithMessage(translator["MaximumLength", "InstagramUrl", "600"]);

                teamMember.RuleFor(x => x.WebsiteUrl)
                    .MaximumLength(600).WithMessage(translator["MaximumLength", "WebsiteUrl", "600"]);
            });
        }
    }
}
