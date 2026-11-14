using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourseComments
{
    public class AddCourseCommentValidate : AbstractValidator<AddCourseComment>
    {
        public AddCourseCommentValidate(ITranslator translator)
        {
            RuleFor(x => x.Content)
                .NotNull().WithMessage(translator["Required", "Comment Message"])
                .NotEmpty().WithMessage(translator["Comment Is Required"])
                .MinimumLength(1).WithMessage(translator["MinimumLength", "Comment MessageText", "1"])
                .MaximumLength(150).WithMessage(translator["MaximumLength", "Comment MessageText", "150"]);
        }
    }
}
