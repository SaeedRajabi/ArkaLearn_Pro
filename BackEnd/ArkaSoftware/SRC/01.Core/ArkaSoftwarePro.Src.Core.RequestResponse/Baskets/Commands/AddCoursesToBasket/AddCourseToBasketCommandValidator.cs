using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Commands.AddCoursesToBasket;

public class AddCourseToBasketCommandValidator : AbstractValidator<AddCourseToBasketCommand>
{
    public AddCourseToBasketCommandValidator(ITranslator translator)
    {
        RuleFor(x => x.CourseId)
            .NotNull().WithMessage(translator["Required", "CourseId"]);

    }
}