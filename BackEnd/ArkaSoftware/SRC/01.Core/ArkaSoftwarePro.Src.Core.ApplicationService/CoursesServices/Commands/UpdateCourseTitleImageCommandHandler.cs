using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.UpdateCourseTitleImage;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands
{
    public class UpdateCourseTitleImageCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICourseCommandRepository courseCommandRepository
        )
        : CommandHandler<UpdateCourseTitleImageCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(UpdateCourseTitleImageCommand command)
        {
            try
            {
                Course? course = await courseCommandRepository.GetAsync(command.CourseId);
                if (course == null!)
                    return await ResultAsync($"Course With Id: {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);


                var titleImageResult = await UploadImage(command.ImageUrl!, command.ImageTitle ?? command.CourseId.ToString());
                course.ChangeCourseTitleImage(titleImageResult);
                await courseCommandRepository.CommitAsync();
                return await OkAsync("Course Title Image Changed Success.");
            }
            catch (Exception e)
            {
                return await ResultAsync($"Change Course Title Image Is Not success And Error Accord.", ApplicationServiceStatus.Exception);

            }
        }


        private static async Task<string> UploadImage(IFormFile? file, string title)
        {
            if (file == null || file.Length == 0)
                return "";
            var directoryPath = Path.Combine(Directory.GetCurrentDirectory(), $"wwwroot/images/courses/");
            if (!Directory.Exists(directoryPath))
            {
                Directory.CreateDirectory(directoryPath);
            }
            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(directoryPath, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/images/courses/{fileName}";
            return fileUrl;
        }
    }
}
