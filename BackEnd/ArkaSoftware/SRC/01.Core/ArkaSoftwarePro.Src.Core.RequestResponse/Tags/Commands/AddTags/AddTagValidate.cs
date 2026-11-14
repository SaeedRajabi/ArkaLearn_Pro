using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Commands.AddTags
{
    public class AddTagValidate : AbstractValidator<AddTag>
    {
        public AddTagValidate(ITranslator translator)
        {
            RuleFor(x => x.TagName)
                .NotNull().WithMessage(translator["Required", "TagName"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "TagName", "2"])
                .MaximumLength(100).WithMessage(translator["MaximumLength", "TagName", "100"]);
        }
    }
}
