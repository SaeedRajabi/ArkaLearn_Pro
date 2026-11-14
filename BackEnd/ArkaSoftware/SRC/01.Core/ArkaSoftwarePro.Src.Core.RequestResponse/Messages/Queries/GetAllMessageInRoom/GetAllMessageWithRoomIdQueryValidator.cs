using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;

public class GetAllMessageWithRoomIdQueryValidator : AbstractValidator<GetAllMessageWithRoomIdQuery>
{
    public GetAllMessageWithRoomIdQueryValidator(ITranslator translator)
    {
        RuleFor(x => x.RoomId)
            .NotEmpty().NotNull().WithMessage(translator["Required", "RoomId"])
            .GreaterThan(0).WithMessage(translator["GreaterThan", "RoomId", "0"]);
    }
}