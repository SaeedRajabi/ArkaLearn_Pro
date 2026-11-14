using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId
{
    public class GetRoomByRoomIdQueryValidator:AbstractValidator<GetRoomByRoomIdQuery>
    {
        public GetRoomByRoomIdQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.RoomId)
                .NotEmpty().NotNull().WithMessage(translator["Required" , "RoomId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "RoomId" , "0"]);
        }
    }

}
