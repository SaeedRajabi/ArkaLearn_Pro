using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginByGoogleAccount
{
    public class LoginByGoogleAccountCommandValidator:AbstractValidator<LoginByGoogleAccountCommand>
    {
        public LoginByGoogleAccountCommandValidator(ITranslator translator)
        {
            RuleFor(x => x.Token)
                .NotEmpty().NotNull().WithMessage(translator["Required", "Token"]);
        }
    }
}
