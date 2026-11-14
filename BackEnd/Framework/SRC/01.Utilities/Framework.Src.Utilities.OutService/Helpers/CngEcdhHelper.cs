using System.Security.Cryptography;

namespace Framework.Src.Utilities.OutService.Helpers;

public static class CngEcdhHelper
{
    public static EccDhKeyPair GenerateEcdhBase64StringPrivateKey()
    {
        using var ecdh = ECDiffieHellman.Create();
        ecdh.KeySize = 256;

        var privateKey = ecdh.ExportECPrivateKey();
        var privateKeyBase64String = Convert.ToBase64String(privateKey);


        var publicKey = ecdh.ExportSubjectPublicKeyInfo();
        var publicKeyBase64String = Convert.ToBase64String(publicKey);

        var result = new EccDhKeyPair(privateKeyBase64String, publicKeyBase64String);
        return result;

        //var parameters = new CngKeyCreationParameters
        //{
        //    ExportPolicy = CngExportPolicies.AllowPlaintextExport,
        //};

        //var keys = CngKey.Create(CngAlgorithm.ECDiffieHellmanP256, "" , parameters!);

        //var ecDiffieHellmanCng = new ECDiffieHellmanCng(keys);

        //var privateKeyBase64String = ecDiffieHellmanCng.Key.Export(CngKeyBlobFormat.EccPrivateBlob).AsBase64String();

        //var publicKeyBase64String = ecDiffieHellmanCng.PublicKey.ToByteArray().AsBase64String();

        //var result = new EccDhKeyPair(privateKeyBase64String, publicKeyBase64String);

        //return result;
    }
}

public record EccDhKeyPair(string PrivateKey, string PublicKey);
