namespace ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketByUserId;

public class GetBasketByUserIdQri
{
    public long BasketId { get; set; }
    public List<GetBasketItemQri> BasketItems { get; set; } = new List<GetBasketItemQri>();
}