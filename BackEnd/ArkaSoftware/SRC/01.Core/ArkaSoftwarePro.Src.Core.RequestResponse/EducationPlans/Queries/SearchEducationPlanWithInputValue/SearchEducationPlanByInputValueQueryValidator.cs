using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.SearchEducationPlanWithInputValue
{
    public class SearchEducationPlanByInputValueQueryValidator : AbstractValidator<SearchEducationPlanByInputValueQuery>
    {
        public SearchEducationPlanByInputValueQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.InputValue)
                .MaximumLength(120).WithMessage(translator["MaximumLength", "InputValue", "120"]);
        }
    }
}
