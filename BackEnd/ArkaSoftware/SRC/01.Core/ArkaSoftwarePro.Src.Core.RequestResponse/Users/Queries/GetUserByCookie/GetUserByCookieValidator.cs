using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByCookie
{
    public class GetUserByCookieValidator : AbstractValidator<GetUserByCookieQuery>
    {
        public GetUserByCookieValidator(ITranslator translator)
        {
            RuleFor(x => x.userName)
                .NotEmpty().NotNull().WithMessage(translator["IsRequired", "Cookies"]);
        }
    }
}
