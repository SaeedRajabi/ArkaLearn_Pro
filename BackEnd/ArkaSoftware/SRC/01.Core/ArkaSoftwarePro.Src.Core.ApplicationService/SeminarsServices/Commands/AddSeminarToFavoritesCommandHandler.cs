using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteSeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.Favorites;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands
{
    public class AddSeminarToFavoritesCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarCommandRepository seminarCommandRepository,
        IFavoriteSeminarCommandRepository favoriteSeminarCommandRepository,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<AddSeminarToFavoritesCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddSeminarToFavoritesCommand command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
                    x.Type == ClaimTypes.NameIdentifier ||
                    x.Type == "userId" ||
                    x.Type == "nameid");

                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value) || !long.TryParse(userIdClaim.Value, out var userId))
                    return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

                var seminar = await seminarCommandRepository.GetAsync(command.SeminarId);
                if (seminar == null!)
                    return await ResultAsync($"Seminar With Id : {command.SeminarId} Is Not Defined.", ApplicationServiceStatus.NotFound);

                var exists = await favoriteSeminarCommandRepository.ExistsAsync(userId, command.SeminarId);
                if (exists)
                    return await OkAsync("Seminar Already In Favorites.");

                var favorite = new FavoriteSeminar(userId, command.SeminarId);
                await favoriteSeminarCommandRepository.InsertAsync(favorite);
                await favoriteSeminarCommandRepository.CommitAsync();

                return await OkAsync("Seminar Added To Favorites.");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Add To Favorites Has Error: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
