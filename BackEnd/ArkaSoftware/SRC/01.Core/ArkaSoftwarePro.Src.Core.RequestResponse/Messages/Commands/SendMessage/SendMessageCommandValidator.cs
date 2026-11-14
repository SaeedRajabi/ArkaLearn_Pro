using Extensions.Translations.Abstractions;
using FluentValidation;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Commands.SendMessage
{
    public class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
    {
        public SendMessageCommandValidator(ITranslator translator)
        {
            RuleFor(x => x.RoomId)
                .NotNull().NotEmpty().WithMessage(translator["Required", "RoomId"])
                .GreaterThan(0).WithMessage(translator["GreaterThan", "RoomId", "0"]);


            RuleFor(x => x.Text)
                .NotNull().NotEmpty().WithMessage(translator["Required", "Text"]);
        }
    }
}
