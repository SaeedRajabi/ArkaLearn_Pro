using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId
{
    public class GetAllRoomUserByRoomIdQueryValidator:AbstractValidator<GetAllRoomUserByRoomIdQuery>
    {
        public GetAllRoomUserByRoomIdQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.RoomId)
                .NotEmpty().NotNull().WithMessage(translator["Required", "RoomId"]);
                //.GreaterThan(0).WithMessage(translator["GreaterThan", "RoomId", "0"]);
        }
    }
}
