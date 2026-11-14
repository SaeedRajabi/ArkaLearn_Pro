using System.Security.Cryptography;

namespace ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Services;

public static class DesktopLicenseGenerator
{
    public static string Generate()
    {
        Span<byte> bytes = stackalloc byte[128];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes);
    }
}
