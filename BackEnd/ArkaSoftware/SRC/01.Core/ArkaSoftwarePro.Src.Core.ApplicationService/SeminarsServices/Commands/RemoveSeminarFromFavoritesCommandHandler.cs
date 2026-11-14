using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteSeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.Favorites;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands
{
    public class RemoveSeminarFromFavoritesCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IFavoriteSeminarCommandRepository favoriteSeminarCommandRepository,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<RemoveSeminarFromFavoritesCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(RemoveSeminarFromFavoritesCommand command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
                    x.Type == ClaimTypes.NameIdentifier ||
                    x.Type == "userId" ||
                    x.Type == "nameid");

                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value) || !long.TryParse(userIdClaim.Value, out var userId))
                    return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

                var favorite = await favoriteSeminarCommandRepository.GetByUserAndSeminarAsync(userId, command.SeminarId);
                if (favorite == null)
                    return await ResultAsync("Favorite Seminar Not Found.", ApplicationServiceStatus.NotFound);

                favoriteSeminarCommandRepository.Delete(favorite);
                await favoriteSeminarCommandRepository.CommitAsync();

                return await OkAsync("Seminar Removed From Favorites.");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Remove From Favorites Has Error: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
