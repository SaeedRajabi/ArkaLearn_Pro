using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Commands.UpsertSiteAnnouncement;

public class UpsertSiteAnnouncementCommandValidator : AbstractValidator<UpsertSiteAnnouncementCommand>
{
    public UpsertSiteAnnouncementCommandValidator()
    {
        RuleFor(x => x.TextColor).MaximumLength(20);
        RuleFor(x => x.BackgroundColor).MaximumLength(20);
        RuleFor(x => x.GradientStartColor).MaximumLength(20);
        RuleFor(x => x.GradientEndColor).MaximumLength(20);
        RuleFor(x => x.GradientAngle).InclusiveBetween(0, 359);
        RuleFor(x => x.BackgroundType).InclusiveBetween((byte)0, (byte)2);
        RuleFor(x => x.ContentHtml).MaximumLength(500_000);
    }
}
