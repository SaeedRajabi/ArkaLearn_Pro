using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LogoutUsers
{
    public class LogoutUserValidator : AbstractValidator<LogoutUser>
    {
        public LogoutUserValidator(ITranslator translator)
        {
            RuleFor(x => x.UserId)
                .NotNull().WithMessage(translator["Required", "UserId"])
                .GreaterThan(0).WithMessage(translator["GreaterThanZero", "UserId", "0"]);
        }
    }
}
