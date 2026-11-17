using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateUserStatus;

public class UpdateUserStatusCommandValidator : AbstractValidator<UpdateUserStatusCommand>
{
    public UpdateUserStatusCommandValidator(ITranslator translator)
    {
        RuleFor(x => x.UserId)
            .NotNull().NotEmpty().WithMessage(translator["Required", "UserId"])
            .GreaterThan(0).WithMessage(translator["GreaterThan", "UserId", "0"]);

        RuleFor(x => x.RoomId)
            .NotNull().NotEmpty().WithMessage(translator["Required", "RoomId"])
            .GreaterThan(0).WithMessage(translator["GreaterThan", "RoomId", "0"]);
    }
}