using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetMyWallet;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices.Queries;

public class GetMyWalletQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    UserWalletService walletService,
    IUserWalletRepository walletRepository,
    IUserQueryRepository userQueryRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetMyWalletQuery, MyWalletQri>(outer)
{
    public override async Task<QueryResult<MyWalletQri>> Handle(GetMyWalletQuery query)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var wallet = await walletService.EnsureWalletAsync(userId);
        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
        var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(userId);

        var profileComplete = !string.IsNullOrWhiteSpace(user?.PhoneNumber);
        string? hint = null;
        if (string.IsNullOrWhiteSpace(user?.PhoneNumber))
            hint = "Please verify your mobile number in your profile before using the wallet.";
        else if (teacher != null && !teacher.HasCompletePayoutBankInfo())
            hint = "Teachers: add Sheba and card in profile to receive payouts and connect Zibal.";

        return await ResultAsync(new MyWalletQri
        {
            UserId = userId,
            AvailableBalanceToman = wallet.AvailableBalanceToman,
            ReservedBalanceToman = wallet.ReservedBalanceToman,
            TotalDepositedToman = wallet.TotalDepositedToman,
            TotalSpentToman = wallet.TotalSpentToman,
            TotalReceivedToman = wallet.TotalReceivedToman,
            TotalWithdrawnToman = wallet.TotalWithdrawnToman,
            IsSuspended = wallet.IsSuspended,
            HasZibalSubMerchant = !string.IsNullOrWhiteSpace(wallet.ZibalSubMerchantId),
            ProfileCompleteForWallet = profileComplete,
            ProfileCompletionHint = hint,
        });
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
