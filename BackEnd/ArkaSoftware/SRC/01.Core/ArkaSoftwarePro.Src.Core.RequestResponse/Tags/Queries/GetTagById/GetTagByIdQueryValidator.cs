using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.GetTagById
{
    public class GetTagByIdQueryValidator : AbstractValidator<GetTagByIdQuery>
    {
        public GetTagByIdQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.TagId)
                .NotEmpty().WithMessage(translator["Required", "TagId"])
                .NotNull().WithMessage(translator["NotNull", "TagId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "TagId", "0"]);
        }
    }
}
