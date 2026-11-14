using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.UpdateCategoriesName
{
    public class CategoryNameUpdateValidator : AbstractValidator<CategoryNameUpdate>
    {
        public CategoryNameUpdateValidator(ITranslator translator)
        {
            RuleFor(x => x.CategoryId)
                .NotNull().WithMessage(translator["Required", "CategoryId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "CategoryId"]);
            RuleFor(x => x.CategoryName)
                .NotNull().WithMessage(translator["Required", "CategoryName"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "CategoryName", "2"])
                .MaximumLength(150).WithMessage(translator["MaximumLength", "CategoryName", "150"]);

        }
    }
}
