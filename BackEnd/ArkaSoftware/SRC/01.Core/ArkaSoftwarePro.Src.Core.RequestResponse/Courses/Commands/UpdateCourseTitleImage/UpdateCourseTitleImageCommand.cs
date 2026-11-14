using FluentValidation.Validators;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.UpdateCourseTitleImage
{
    public class UpdateCourseTitleImageCommand: ICommand<string>, IWebRequest
    {
        public long CourseId { get; set; }
        public IFormFile? ImageUrl { get; set; }
        public string? ImageTitle { get; set; }

        public string Path => "api/Service/Course/Update/CourseTitleImage";
    }
}
