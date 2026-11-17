using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;
namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRooms
{
    public class AddRoomCommandValidator : AbstractValidator<AddRoomCommand>
    {
        public AddRoomCommandValidator(ITranslator translator)
        {
            RuleFor(x => x.Title)
                .NotEmpty().NotNull().WithMessage(translator["Required", "RoomTitle"]);
        }
    }
}
