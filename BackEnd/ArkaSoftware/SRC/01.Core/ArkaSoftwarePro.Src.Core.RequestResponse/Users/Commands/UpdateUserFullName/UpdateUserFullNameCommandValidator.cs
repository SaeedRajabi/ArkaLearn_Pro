using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.UpdateUserFullName
{
    public class UpdateUserFullNameCommandValidator : AbstractValidator<UpdateUserFullNameCommand>
    {
        public UpdateUserFullNameCommandValidator(ITranslator translator)
        {
            RuleFor(x => x.UserId).NotNull().WithMessage(translator["Required", "UserId"]);

            RuleFor(x => x.FirstName)
                .NotEmpty().NotNull().WithMessage(translator["Required", "FirstName"])
                .MaximumLength(100).WithMessage(translator["MaximumLength", "FirstName", "100"]);

            RuleFor(x => x.LastName)
                .NotEmpty().NotNull().WithMessage(translator["Required", "LastName"])
                .MaximumLength(100).WithMessage(translator["MaximumLength", "LastName", "100"]);
        }
    }
}
