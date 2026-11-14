using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateOrderFromClientBasket
{
    public class CreateOrderFromClientBasketCommand : ICommand<string>, IWebRequest
    {
        public List<ClientBasketItemDto> Items { get; set; } = new();
        public string? Description { get; set; }
        public string? DiscountCode { get; set; }
        public string Path => "/api/Service/Order/CreateFromClientBasket";
    }

    public class ClientBasketItemDto
    {
        public long CourseId { get; set; }
        public int Quantity { get; set; }
        public string? CourseName { get; set; } = string.Empty;
        public string? CourseImage { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}
