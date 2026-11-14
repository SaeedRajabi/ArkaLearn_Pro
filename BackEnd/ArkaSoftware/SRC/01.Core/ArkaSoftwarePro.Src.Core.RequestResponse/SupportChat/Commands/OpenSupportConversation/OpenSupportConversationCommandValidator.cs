using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.OpenSupportConversation;

public class OpenSupportConversationCommandValidator : AbstractValidator<OpenSupportConversationCommand>
{
    public OpenSupportConversationCommandValidator()
    {
        RuleFor(x => x.TeacherUserId)
            .GreaterThan(0)
            .WithMessage("Teacher is required.");

        RuleFor(x => x.Subject)
            .Must(s => (s ?? string.Empty).Trim().Length >= 3)
            .WithMessage("Subject must be at least 3 characters.");
    }
}
