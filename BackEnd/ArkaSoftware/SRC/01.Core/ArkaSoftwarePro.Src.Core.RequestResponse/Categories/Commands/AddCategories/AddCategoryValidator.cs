using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.AddCategories
{
    public class AddCategoryValidator : AbstractValidator<AddCategory>
    {
        public AddCategoryValidator(ITranslator translator)
        {
            RuleFor(x => x.CategoryName)
                .NotNull().WithMessage(translator["Required", "CategoryName"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "CategoryName", "2"])
                .MaximumLength(150).WithMessage(translator["MaximumLength", "CategoryName", "150"]);


        }
    }
}
