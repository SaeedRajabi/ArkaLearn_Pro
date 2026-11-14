using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Commands.CreateStudents;

public class CreateStudentCommandValidator:AbstractValidator<CreateStudentCommand>
{
    public CreateStudentCommandValidator(ITranslator translator)
    {
        RuleFor(x => x.UserId)
            .NotEmpty().NotNull().WithMessage(translator["Required", "UserId"]);
    }
}