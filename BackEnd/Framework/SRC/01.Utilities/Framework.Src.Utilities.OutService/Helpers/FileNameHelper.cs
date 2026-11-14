namespace Framework.Src.Utilities.OutService.Helpers;

public static class FileNameHelper
{
    public const string ParametersFileName = "DHP.pem";

    public const string DownloadedParametersFileName = "DOWNLOADED_DHP.pem";

    private const string OpenSslPrefix = "OPENSSL";

    private const string CngPrefix = "CNG";

    // Begin OpenSsl Methods
    public static string GenerateOpenSslPrivateKeyFileName(Guid senderId, Guid receiverId)
    {
        return GeneratePrivateKeyFileName(senderId, receiverId, OpenSslPrefix);
    }

    public static string GenerateOpenSslPublicKeyFileName(Guid senderId, Guid receiverId)
    {
        return GeneratePublicKeyFileName(senderId, receiverId, OpenSslPrefix);
    }

    public static string GenerateOpenSslCommonSecretFileName(Guid senderId, Guid receiverId)
    {
        return GenerateCommonSecretFileName(senderId, receiverId, OpenSslPrefix);
    }

    // Begin CNG Methods
    public static string GenerateCngPrivateKeyFileName(Guid senderId, Guid receiverId)
    {
        return GeneratePrivateKeyFileName(senderId, receiverId, CngPrefix);
    }

    public static string GenerateCngPublicKeyFileName(Guid senderId, Guid receiverId)
    {
        return GeneratePublicKeyFileName(senderId, receiverId, CngPrefix);
    }

    public static string GenerateCngCommonSecretFileName(Guid senderId, Guid receiverId)
    {
        return GenerateCommonSecretFileName(senderId, receiverId, CngPrefix);
    }

    // Begin private methods
    private static string GeneratePrivateKeyFileName(Guid senderId, Guid receiverId, string prefix)
    {
        return $"{prefix}_PRIVATE_KEY_{senderId}_{receiverId}.pem";
    }

    private static string GeneratePublicKeyFileName(Guid senderId, Guid receiverId, string prefix)
    {
        return $"{prefix}_PUBLIC_KEY_{senderId}_{receiverId}.pem";
    }

    private static string GenerateCommonSecretFileName(Guid senderId, Guid receiverId, string prefix)
    {
        return $"{prefix}_COMMON_SECRET_{senderId}_{receiverId}.pem";
    }
}
