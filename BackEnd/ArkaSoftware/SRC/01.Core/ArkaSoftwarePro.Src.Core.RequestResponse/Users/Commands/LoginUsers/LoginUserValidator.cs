using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginUsers
{
    public class LoginUserValidator : AbstractValidator<LoginUser>
    {
        public LoginUserValidator(ITranslator translator)
        {
            RuleFor(x => x.UserNameOrEmail)
                .NotNull().WithMessage(translator["Required", "UserNameOrEmail"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "UserNameOrEmail", "2"])
                .MaximumLength(120).WithMessage(translator["MaximumLength", "UserNameOrEmail", "120"]);

            RuleFor(x => x.Password)
                .NotNull().WithMessage(translator["Required", "Password"])
                .MinimumLength(4).WithMessage(translator["MinimumLength", "Password", "4"])
                .MaximumLength(20).WithMessage(translator["MaximumLength", "Password", "20"]);
        }
    }
}
