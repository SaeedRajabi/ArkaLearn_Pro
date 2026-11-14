using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteCourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.Favorites;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands
{
    public class RemoveCourseFromFavoritesCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IFavoriteCourseCommandRepository favoriteCourseCommandRepository,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<RemoveCourseFromFavoritesCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(RemoveCourseFromFavoritesCommand command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
                    x.Type == ClaimTypes.NameIdentifier ||
                    x.Type == "userId" ||
                    x.Type == "nameid");

                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value) || !long.TryParse(userIdClaim.Value, out var userId))
                    return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

                var favorite = await favoriteCourseCommandRepository.GetByUserAndCourseAsync(userId, command.CourseId);
                if (favorite == null)
                    return await ResultAsync("Favorite Course Not Found.", ApplicationServiceStatus.NotFound);

                favoriteCourseCommandRepository.Delete(favorite);
                await favoriteCourseCommandRepository.CommitAsync();

                return await OkAsync("Course Removed From Favorites.");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Remove From Favorites Has Error: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
