using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId
{
    public class GetAllRoomByOwnerQueryValidator : AbstractValidator<GetAllRoomsByOwnerIdQuery>
    {
        public GetAllRoomByOwnerQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.UserId)
                .NotEmpty().NotNull().WithMessage(translator["Required", "UserId"]);
        }
    }
}
