using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue
{
    public class SearchCategoryQueryValidator : AbstractValidator<SearchCategoryQuery>
    {
        public SearchCategoryQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.CategoryName)
                .MaximumLength(150).WithMessage(translator["MaximumLength", "CategoryName", "150"]);
        }
    }
}
