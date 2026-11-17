using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LoginUserIntoRoom
{
    public class LoginUserIntoRoomCommandValidator : AbstractValidator<LoginUserIntoRoomCommand>
    {
        public LoginUserIntoRoomCommandValidator(ITranslator translator)
        {
            RuleFor(x => x.RoomId)
                .NotNull().NotEmpty().WithMessage(translator["Required", "RoomId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "RoomId", "0"]);

            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage(translator["Required", "UserName"])
                .MaximumLength(120).WithMessage(translator["MaximumLength", "UserName", "120"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "UserName", "2"]);

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(translator["Required", "Password"])
                .MaximumLength(128).WithMessage(translator["MaximumLength", "Password", "128"])
                .MinimumLength(5).WithMessage(translator["MinimumLength", "Password", "5"])
                .When(x => !x.IsGuest);
        }
    }
}
