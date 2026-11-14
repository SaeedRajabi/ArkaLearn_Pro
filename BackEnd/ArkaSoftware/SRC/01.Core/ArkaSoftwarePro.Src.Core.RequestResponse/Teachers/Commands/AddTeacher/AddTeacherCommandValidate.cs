using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AddTeacher;

public class AddTeacherCommandValidate : AbstractValidator<AddTeacherCommand>
{
    public AddTeacherCommandValidate(ITranslator translator)
    {
        RuleFor(x => x.UserId)
            .NotNull().WithMessage(translator["Required", "UserId"]);

        RuleFor(x => x.ShortDescription)
            .NotNull().WithMessage(translator["Required", "ShortDescription"])
            .MinimumLength(2).WithMessage(translator["MinimumLength", "ShortDescription", "2"])
            .MaximumLength(100).WithMessage(translator["MaximumLength", "ShortDescription", "100"]);

        RuleFor(x => x.LongDescription)
            .NotNull().WithMessage(translator["Required", "LongDescription"])
            .MinimumLength(2).WithMessage(translator["MinimumLength", "LongDescription", "2"])
            .MaximumLength(100).WithMessage(translator["MaximumLength", "LongDescription", "100"]);

            
    }
}