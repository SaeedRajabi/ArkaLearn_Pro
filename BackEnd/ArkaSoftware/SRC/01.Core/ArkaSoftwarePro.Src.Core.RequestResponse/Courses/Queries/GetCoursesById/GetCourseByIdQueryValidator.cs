using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById
{
    public class GetCourseByIdQueryValidator : AbstractValidator<GetCourseByIdQuery>
    {
        public GetCourseByIdQueryValidator(ITranslator translator)
        {
            RuleFor(x => x.CourseId)
                .NotEmpty().WithMessage(translator["Required", "CourseId"])
                .NotNull().WithMessage(translator["NotNull", "CourseId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "CourseId", "0"]);
        }
    }
}
