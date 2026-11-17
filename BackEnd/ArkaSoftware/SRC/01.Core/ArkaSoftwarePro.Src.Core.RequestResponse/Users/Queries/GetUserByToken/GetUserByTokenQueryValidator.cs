using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByToken
{
    public class GetUserByTokenQueryValidator : AbstractValidator<GetUserByTokenQuery>
    {
        public GetUserByTokenQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.Token)
                .NotEmpty()
                .WithMessage(translator["Required", nameof(GetUserByTokenQuery)]);
        }
    }
}
