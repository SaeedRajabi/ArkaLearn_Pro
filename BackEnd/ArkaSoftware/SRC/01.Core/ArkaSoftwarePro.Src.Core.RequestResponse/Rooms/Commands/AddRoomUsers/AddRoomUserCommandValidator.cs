using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRoomUsers
{
    public class AddRoomUserCommandValidator : AbstractValidator<AddRoomUserCommand>
    {
        public AddRoomUserCommandValidator(ITranslator translator) 
        {

            RuleFor(x => x.RoomId)
                .NotEmpty().NotNull().WithMessage(translator["Required", "RoomId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "RoomId", "0"]);

            RuleFor(x => x.FirstName)
                .NotEmpty().NotNull().WithMessage(translator["Required", "FirstName"])
                .MaximumLength(50).WithMessage(translator["MaximumLength", "FirstName", "50"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "FirstName", "2"]);


            RuleFor(x => x.LastName)
                .NotEmpty().NotNull().WithMessage(translator["Required", "LastName"])
                .MaximumLength(50).WithMessage(translator["MaximumLength", "FirstName", "50"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "FirstName", "2"]);

            RuleFor(x => x.UserName)
                .NotEmpty().NotNull().WithMessage(translator["Required", "UserName"])
                .MaximumLength(120).WithMessage(translator["MaximumLength", "FirstName", "120"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "FirstName", "2"]);

            RuleFor(x => x.Password)
                .NotEmpty().NotNull().WithMessage(translator["Required", "Password"])
                .MaximumLength(12).WithMessage(translator["MaximumLength", "FirstName", "12"])
                .MinimumLength(5).WithMessage(translator["MinimumLength", "FirstName", "5"]);

        }
    }
}
