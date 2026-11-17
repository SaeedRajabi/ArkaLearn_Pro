using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById
{
    public class GetUserByIdQueryValidator : AbstractValidator<GetUserByIdQuery>
    {
        public GetUserByIdQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.UserId)
                .NotEmpty()
                .WithMessage(translator["Required", nameof(GetUserByIdQuery.UserId)]);
        }
    }
}
