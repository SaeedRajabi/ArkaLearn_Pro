using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using Extensions.Translations.Abstractions;
using FluentValidation;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AddUsers
{
    public class AddUserValidator : AbstractValidator<AddUser>
    {
        private static readonly Regex EnglishUserNameRegex = new(
            @"^[a-zA-Z][a-zA-Z0-9_]{2,29}$",
            RegexOptions.Compiled);

        public AddUserValidator(ITranslator translator)
        {
            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage(translator["Required", "UserName"])
                .Must(name => EnglishUserNameRegex.IsMatch(name.Trim()))
                .WithMessage("Username must be 3–30 English letters, numbers, or underscores, and start with a letter.");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage(translator["Required", "FullName"])
                .MinimumLength(2).WithMessage(translator["MinimumLength", "FullName", "2"])
                .MaximumLength(120).WithMessage(translator["MaximumLength", "FullName", "120"]);

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(translator["Required", "Email"])
                .EmailAddress().WithMessage(translator["Invalid", "Email"])
                .Must(IsAsciiOnly).WithMessage("Email must use English (ASCII) characters only.")
                .MaximumLength(120).WithMessage(translator["MaximumLength", "Email", "120"]);

            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage(translator["Required", "PhoneNumber"])
                .Must(phone => IranianPhoneNormalizer.TryNormalizeLocalNumber(phone, out _))
                .WithMessage("Phone number must be a valid Iranian mobile number (e.g. 09182767745).");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(translator["Required", "Password"])
                .MinimumLength(8).WithMessage(translator["MinimumLength", "Password", "8"])
                .MaximumLength(100).WithMessage(translator["MaximumLength", "Password", "100"]);
        }

        private static bool IsAsciiOnly(string? value)
        {
            if (string.IsNullOrEmpty(value)) return false;
            return value.All(c => c <= 127);
        }
    }
}
