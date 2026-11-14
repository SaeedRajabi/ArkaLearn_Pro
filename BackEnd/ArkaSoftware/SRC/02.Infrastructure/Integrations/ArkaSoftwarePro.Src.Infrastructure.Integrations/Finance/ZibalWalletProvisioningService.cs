using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;
using Framework.Src.Infrastructure.Payments.Zibal.Models.Platform;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Finance;

public sealed class ZibalWalletProvisioningService(
    IZibalPlatformClient zibalPlatformClient,
    ITeacherCommandRepository teacherCommandRepository,
    IUserQueryRepository userQueryRepository,
    IUserWalletRepository walletRepository) : IZibalWalletProvisioningService
{
    public async Task TryProvisionTeacherSubMerchantAsync(long teacherId, CancellationToken cancellationToken = default)
    {
        var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(teacherId, cancellationToken);
        if (teacher?.UserId is not long userId || !teacher.HasCompletePayoutBankInfo())
            return;

        if (!string.IsNullOrWhiteSpace(teacher.ZibalSubMerchantId))
            return;

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
        var name = user?.FullName;
        if (string.IsNullOrWhiteSpace(name))
            name = user?.UserName ?? $"Teacher {teacherId}";

        try
        {
            var result = await zibalPlatformClient.CreateSubMerchantAsync(
                new ZibalSubMerchantCreateRequest
                {
                    BankAccount = teacher.PayoutSheba!,
                    Name = name.Trim(),
                },
                cancellationToken);

            teacher.SetZibalSubMerchantId(result.Id);
            var wallet = await walletRepository.GetOrCreateByUserIdAsync(userId, cancellationToken);
            wallet.SetZibalSubMerchant(result.Id);
            await walletRepository.CommitAsync(cancellationToken);
            await teacherCommandRepository.CommitAsync();
        }
        catch
        {
            // Provisioning may be disabled on token or pending Zibal approval — bank info is still saved locally.
        }
    }
}
