using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateDiscountCode;

public class CreateDiscountCodeCommandValidator : AbstractValidator<CreateDiscountCodeCommand>
{
    public CreateDiscountCodeCommandValidator(ITranslator translator)
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage(translator["Required", "DiscountCode"])
            .MinimumLength(4).WithMessage(translator["MinimumLength", "DiscountCode", "4"])
            .MaximumLength(32).WithMessage(translator["MaximumLength", "DiscountCode", "32"]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(translator["GreaterThanZero", "DiscountAmount"]);

        RuleFor(x => x.DiscountType)
            .InclusiveBetween((byte)1, (byte)2);

        RuleFor(x => x.UsageLimit)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.ScopeType)
            .InclusiveBetween((byte)0, (byte)3);

        RuleFor(x => x)
            .Must(x => x.ExpirationDate.HasValue || (x.DurationValue is > 0 && !string.IsNullOrWhiteSpace(x.DurationUnit)))
            .WithMessage("Expiration date or duration is required.");
    }
}
