using ArkaSoftware.Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.UpdateCourseTitleImage;

public class UpdateCourseTitleImageCommandValidate : AbstractValidator<UpdateCourseTitleImageCommand>
{
    public UpdateCourseTitleImageCommandValidate(ITranslator translator)
    {
        RuleFor(x => x.CourseId)
            .NotNull().NotEmpty().WithMessage(translator["Not Empty", "CourseId"]);
        RuleFor(x => x.ImageUrl)
            .NotEmpty().WithMessage(translator["Not Empty", "SectionTitle"]);
    }
}