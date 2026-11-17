using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateOrderFromClientBasket
{
    public class CreateOrderFromClientBasketCommandValidator : AbstractValidator<CreateOrderFromClientBasketCommand>
    {
        public CreateOrderFromClientBasketCommandValidator(ITranslator translator)
        {
            RuleFor(x => x.Items)
                .NotNull().WithMessage("Items cannot be null")
                .Must(x => x != null && x.Any()).WithMessage("Basket cannot be empty");

            RuleForEach(x => x.Items).ChildRules(items =>
            {
                items.RuleFor(x => x.CourseId).GreaterThan(0).WithMessage("Invalid CourseId");
                items.RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("Quantity must be greater than 0");
            });
        }
    }
}
