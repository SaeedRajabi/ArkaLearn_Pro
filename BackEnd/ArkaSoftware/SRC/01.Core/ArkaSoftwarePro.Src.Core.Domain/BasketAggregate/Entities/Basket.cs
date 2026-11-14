using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using Framework.Src.Core.Domain.Aggregates;
using System.Linq;

namespace ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities
{
    public class Basket:AggregateRoot
    {

        private readonly List<BasketItem> _items = new();
        public IReadOnlyList<BasketItem> Items => _items.AsReadOnly();

        public DiscountCode? DiscountCode { get; private set; }  // کد تخفیف
        public long DiscountCodeId { get; private set; }

        public Basket(long basketId)
        {
            Id = basketId;
        }
        public Basket()
        {
            
        }
        public virtual void Add(Course course, int quantity)
        {
            var basketItem = _items.FirstOrDefault(c => c.Course?.Id == course.Id);
            if (basketItem != null)
            {
                basketItem.IncrementQuantity(quantity);
            }
            else
            {
                BasketItem basketItemNew = new(course, quantity);
                _items.Add(basketItemNew);
            }
        }

        public virtual void Remove(Course product) =>
            _items.RemoveAll(c => c.Course?.Id == product.Id);

        public decimal? TotalPrice()
        {
            decimal? total = _items.Sum(c => c.Course?.Price!.Amount * c.Quantity);

            if (DiscountCode! != null!)
            {
                total = DiscountCode.ApplyDiscount(total ?? 0);  // اعمال تخفیف
            }
            return total;
        }

        public virtual void Clear() => _items.Clear();


        // افزودن کد تخفیف به سبد خرید
        public void AddDiscount(DiscountCode discountCode)
        {
            DiscountCode = discountCode;
        }

        public void RemoveItem(long courseId)
        {
            var item = _items.FirstOrDefault(i => i.Course?.Id == courseId);
            if (item != null)
            {
                _items.Remove(item);
            }
        }

    }
}
