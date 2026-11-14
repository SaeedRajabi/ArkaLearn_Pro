using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Commands.AddCoursesToBasket
{
    public class AddCourseToBasketCommand:ICommand<string> , IWebRequest
    {
        public long CourseId { get; set; }
        public int Quantity { get; set; }
        public string Path => "/api/Service/Basket/AddCourseToBasket";
    }
}
