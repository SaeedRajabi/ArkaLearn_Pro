namespace ArkaSoftwarePro.Src.Core.Contracts.Finance;

public interface IZibalWalletProvisioningService
{
    Task TryProvisionTeacherSubMerchantAsync(long teacherId, CancellationToken cancellationToken = default);
}
