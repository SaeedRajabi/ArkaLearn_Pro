namespace ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;

public static class PaymentGatewayProviderNormalizer
{
    public static string Normalize(string? provider)
    {
        var value = (provider ?? string.Empty).Trim();
        if (value.Length == 0)
            return "IdPay";

        if (string.Equals(value, "zipal", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(value, "zibal", StringComparison.OrdinalIgnoreCase))
            return "Zibal";

        if (string.Equals(value, "zarinpal", StringComparison.OrdinalIgnoreCase))
            return "ZarinPal";

        if (string.Equals(value, "idpay", StringComparison.OrdinalIgnoreCase))
            return "IdPay";

        return value;
    }

    public static bool IsZibal(string? provider) =>
        string.Equals(Normalize(provider), "Zibal", StringComparison.Ordinal);

    public static bool IsZarinPal(string? provider) =>
        string.Equals(Normalize(provider), "ZarinPal", StringComparison.Ordinal);
}
