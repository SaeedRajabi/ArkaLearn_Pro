using FluentValidation;
using Extensions.Translations.Abstractions;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.RenewDesktopSession
{
    public class RenewDesktopSessionCommandValidator : AbstractValidator<RenewDesktopSessionCommand>
    {
        public RenewDesktopSessionCommandValidator(ITranslator translator)
        {
            RuleFor(x => x.AccessToken)
                .NotEmpty().NotNull().WithMessage(translator["Required", "AccessToken"]);
        }
    }
}
