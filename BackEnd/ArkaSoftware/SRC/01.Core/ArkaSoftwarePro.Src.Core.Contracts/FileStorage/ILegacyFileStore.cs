namespace ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

public interface ILegacyFileStore
{
    Stream? OpenRead(string relativeUrl);
    void Delete(string relativeUrl);
}
