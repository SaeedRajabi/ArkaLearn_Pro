using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue
{
    public class SearchCourseByInputValueQueryValidator : AbstractValidator<SearchCourseByInputValueQuery>
    {
        public SearchCourseByInputValueQueryValidator(ITranslator translator)
        {
            //RuleFor(x => x.InputValue)
            //    .MaximumLength(120).WithMessage(translator["MaximumLength", "InputValue", "120"]);
        }
    }
}
