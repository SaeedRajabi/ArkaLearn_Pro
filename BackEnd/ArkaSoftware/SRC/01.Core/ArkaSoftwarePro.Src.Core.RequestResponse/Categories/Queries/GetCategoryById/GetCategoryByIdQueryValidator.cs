using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById
{
    public class GetCategoryByIdQueryValidator : AbstractValidator<GetCategoryByIdQuery>
    {
        public GetCategoryByIdQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage(translator["Required", "CategoryId"])
                .NotNull().WithMessage(translator["NotNull", "CategoryId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "CategoryId", "0"]);
        }
    }
}
