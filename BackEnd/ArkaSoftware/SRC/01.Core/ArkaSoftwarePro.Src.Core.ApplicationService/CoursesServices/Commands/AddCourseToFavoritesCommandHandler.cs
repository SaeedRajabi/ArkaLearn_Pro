using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteCourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.Favorites;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands
{
    public class AddCourseToFavoritesCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICourseCommandRepository courseCommandRepository,
        IFavoriteCourseCommandRepository favoriteCourseCommandRepository,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<AddCourseToFavoritesCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddCourseToFavoritesCommand command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
                    x.Type == ClaimTypes.NameIdentifier ||
                    x.Type == "userId" ||
                    x.Type == "nameid");

                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value) || !long.TryParse(userIdClaim.Value, out var userId))
                    return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

                var courseExist = await courseCommandRepository.GetAsync(command.CourseId);
                if (courseExist == null!)
                    return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);

                var exists = await favoriteCourseCommandRepository.ExistsAsync(userId, command.CourseId);
                if (exists)
                    return await OkAsync("Course Already In Favorites.");

                var favorite = new FavoriteCourse(userId, command.CourseId);
                await favoriteCourseCommandRepository.InsertAsync(favorite);
                await favoriteCourseCommandRepository.CommitAsync();

                return await OkAsync("Course Added To Favorites.");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Add To Favorites Has Error: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
