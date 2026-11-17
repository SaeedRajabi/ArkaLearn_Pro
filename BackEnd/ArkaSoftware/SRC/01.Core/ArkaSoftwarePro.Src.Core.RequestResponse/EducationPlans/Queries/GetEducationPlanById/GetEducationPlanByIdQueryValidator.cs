using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById
{
    public class GetEducationPlanByIdQueryValidator : AbstractValidator<GetEducationPlanByIdQuery>
    {
        public GetEducationPlanByIdQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.PlanId)
                .NotEmpty().NotNull().WithMessage(translator["Required", "EducationPlanId"]);
        }
    }
}
