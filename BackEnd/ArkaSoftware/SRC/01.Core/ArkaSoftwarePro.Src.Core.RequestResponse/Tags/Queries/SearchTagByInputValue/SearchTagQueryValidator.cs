using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.SearchTagByInputValue
{
    public class SearchTagQueryValidator : AbstractValidator<SearchTagQuery>
    {
        public SearchTagQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.TagName)
                .MaximumLength(100).WithMessage(translator["MaximumLength", "TagName", "100"]);
        }
    }
}
