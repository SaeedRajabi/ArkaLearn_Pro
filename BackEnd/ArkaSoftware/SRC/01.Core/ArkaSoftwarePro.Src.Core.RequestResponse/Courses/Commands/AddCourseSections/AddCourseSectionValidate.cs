using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourseSections
{
    public class AddCourseSectionValidate : AbstractValidator<AddCourseSection>
    {
        public AddCourseSectionValidate(ITranslator translator)
        {
            RuleFor(x => x.CourseId)
                .NotNull().NotEmpty().WithMessage(translator["Not Empty", "CourseId"]);
            RuleFor(x => x.SectionTitle)
                .NotEmpty().WithMessage(translator["Not Empty", "SectionTitle"]);
        }
    }
}
