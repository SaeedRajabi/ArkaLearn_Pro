using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.AddOrderItemsToCart
{
    public class AddOrderItemsToCartCommand:ICommand<string> , IWebRequest
    {
        public long CourseId { get; set; }
        public long StudentId { get; set; }
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string Path => "/api/Service/Order/AddCourseToCart";
    }
}
