using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses
{
    public class AddCourseValidate : AbstractValidator<AddCourse>
    {
        public AddCourseValidate(ITranslator translator)
        {
            RuleFor(x => x.Title)
                .NotNull().WithMessage(translator["Required", "Title"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "Title", "2"])
                .MaximumLength(120).WithMessage(translator["MaximumLength", "Title", "120"]);

        }
    }
}
