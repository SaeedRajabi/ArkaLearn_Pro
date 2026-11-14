using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.AddOrderItemsToCart;

public class AddOrderItemsToCartCommandValidator : AbstractValidator<AddOrderItemsToCartCommand>
{
    public AddOrderItemsToCartCommandValidator(ITranslator translator)
    {
        RuleFor(x => x.CourseId)
            .NotEmpty().NotNull().WithMessage(translator["Required", "CourseId"])
            .LessThan(0).WithMessage(translator["LessThanZero", "CourseId", "0"]);

        RuleFor(x => x.UnitPrice)
            .NotEmpty().NotNull().WithMessage(translator["Required", "UnitPrice"])
            .LessThan(0).WithMessage(translator["LessThanZero", "UnitPrice", "0"]);

        RuleFor(x => x.Quantity)
            .NotEmpty().NotNull().WithMessage(translator["IsRequired", "Quantity"]);
    }
}