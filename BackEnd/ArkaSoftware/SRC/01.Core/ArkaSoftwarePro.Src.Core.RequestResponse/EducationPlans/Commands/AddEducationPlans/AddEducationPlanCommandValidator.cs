using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.AddEducationPlans
{
    public class AddEducationPlanCommandValidator:AbstractValidator<AddEducationPlanCommand>
    {
        public AddEducationPlanCommandValidator(ITranslator translator)
        {

            RuleFor(x => x.Title)
                .NotNull().NotEmpty().WithMessage(translator["Required", "Plan Title"])
                .MaximumLength(100).WithMessage(translator["MaximumLength", "Plan Title", "100"]);

            RuleFor(x => x.HourlyRate)
                .NotNull().NotEmpty().WithMessage(translator["Required", "HourlyRate"]);


            RuleFor(x => x.TotalHours)
                .NotNull().NotEmpty().WithMessage(translator["Required", "TotalHours"]);


            RuleFor(x => x.TotalCost)
                .NotNull().NotEmpty().WithMessage(translator["Required", "TotalCost"]);

            RuleFor(x => x.ManagedRoomStudentId).GreaterThan(0);
            RuleFor(x => x.RoomId).GreaterThan(0);
            RuleFor(x => x.OwnerUserId).GreaterThan(0);
            RuleFor(x => x.EndDateUtc).GreaterThanOrEqualTo(x => x.StartDateUtc);
        }
    }
}
