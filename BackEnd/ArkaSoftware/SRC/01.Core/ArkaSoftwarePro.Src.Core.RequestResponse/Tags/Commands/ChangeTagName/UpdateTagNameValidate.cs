using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Commands.ChangeTagName
{
    public class UpdateTagNameValidate : AbstractValidator<UpdateTagName>
    {
        public UpdateTagNameValidate(ITranslator translator)
        {
            RuleFor(x => x.TagId)
                .NotEmpty().WithMessage(translator["Required", "TagId"])
                .NotNull().WithMessage(translator["NotNull", "TagId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "TagId", "0"]);


            RuleFor(x => x.TagName)
                .NotEmpty().WithMessage(translator["Required", "TagName"])
                .NotNull().WithMessage(translator["NotNull", "TagName"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "TagName", "2"])
                .MaximumLength(100).WithMessage(translator["MaximumLength", "TagName", "100"]);
        }
    }
}
