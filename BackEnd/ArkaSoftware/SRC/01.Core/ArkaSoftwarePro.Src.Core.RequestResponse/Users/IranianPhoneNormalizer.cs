namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users;

public static class IranianPhoneNormalizer
{
    public const string CountryCode = "+98";

    /// <summary>
    /// Normalizes Iranian mobile input (e.g. 09182767745) to 10 digits without leading zero (9182767745).
    /// </summary>
    public static bool TryNormalizeLocalNumber(string? input, out string localNumber)
    {
        localNumber = string.Empty;
        if (string.IsNullOrWhiteSpace(input))
            return false;

        var digits = new string(input.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("0098", StringComparison.Ordinal))
            digits = digits[4..];
        else if (digits.StartsWith("98", StringComparison.Ordinal) && digits.Length >= 12)
            digits = digits[2..];

        if (digits.StartsWith('0'))
            digits = digits[1..];

        if (digits.Length == 10 && digits[0] == '9')
        {
            localNumber = digits;
            return true;
        }

        return false;
    }
}
