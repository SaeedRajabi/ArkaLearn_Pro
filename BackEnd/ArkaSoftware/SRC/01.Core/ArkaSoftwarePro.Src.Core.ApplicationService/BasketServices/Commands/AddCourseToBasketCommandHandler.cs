using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Commands.AddCoursesToBasket;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Generator;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.BasketServices.Commands
{
    public class AddCourseToBasketCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICourseCommandRepository courseCommandRepository,
        IBasketCommandRepository basketCommandRepository,
        IHttpContextAccessor httpContext,
        IdGenerator generator,
        IMemoryCache cache
        )
        : CommandHandler<AddCourseToBasketCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddCourseToBasketCommand command)
        {
            try
            {
                var course = await courseCommandRepository.GetAsync(command.CourseId);
                if (course == null!)
                    return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined",
                        ApplicationServiceStatus.NotFound);

                await courseCommandRepository.SyncLifecycleTransitionsAsync(command.CourseId);
                course = await courseCommandRepository.GetAsync(command.CourseId);
                if (course == null!)
                    return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined",
                        ApplicationServiceStatus.NotFound);

                var effectivePhase = course.GetEffectiveLifecyclePhase(DateTime.UtcNow);
                if (!course.IsPubliclyVisible || !CourseLifecycleRules.CanAcceptRegistration(
                        course.IsPublish,
                        effectivePhase,
                        course.IsRegistrationClosed))
                    return await ResultAsync("Course registration is not available.",
                        ApplicationServiceStatus.ValidationError);


                var basketId = httpContext.HttpContext.Request.Cookies["basketId"];
                if (string.IsNullOrEmpty(basketId))
                {
                    basketId = generator.Next().ToString();
                    httpContext.HttpContext.Response.Cookies.Append("basketId", basketId, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = false,
                        SameSite = SameSiteMode.Lax,
                        Expires = DateTimeOffset.UtcNow.AddDays(7)
                    });
                    Basket basket = new Basket(Convert.ToInt64(basketId));
                    basket.Add(course, command.Quantity);
                    await basketCommandRepository.InsertAsync(basket);
                    await basketCommandRepository.CommitAsync();

                    // افزودن به cache
                    var items = new List<(long, int)> { (command.CourseId, command.Quantity) };
                    cache.Set(basketId, items, TimeSpan.FromDays(7));

                    return await OkAsync("Add Course To Basket Success");
                }

                var basketDefined = await basketCommandRepository.GetGraphAsync(Convert.ToInt64(basketId));
                if (basketDefined == null)
                {
                    // اگر سبد وجود نداشت، یک سبد جدید ایجاد می‌کنیم
                    Basket newBasket = new Basket(Convert.ToInt64(basketId));
                    newBasket.Add(course, command.Quantity);
                    await basketCommandRepository.InsertAsync(newBasket);
                    await basketCommandRepository.CommitAsync();

                    // افزودن به cache
                    var newItems = new List<(long, int)> { (command.CourseId, command.Quantity) };
                    cache.Set(basketId, newItems, TimeSpan.FromDays(7));

                    return await OkAsync("Add Course To Basket Success");
                }

                // اگر سبد وجود داشت، دوره را اضافه می‌کنیم
                basketDefined.Add(course, command.Quantity);

                // به‌روزرسانی cache
                var cachedItems = cache.GetOrCreate(basketId, entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7);
                    return new List<(long, int)>();
                });

                var existingItem = cachedItems.FirstOrDefault(x => x.Item1 == command.CourseId);
                if (existingItem.Item1 != 0 && existingItem.Item1 == command.CourseId)
                {
                    // اگر دوره قبلاً در cache بود، quantity را افزایش می‌دهیم
                    cachedItems.Remove(existingItem);
                    cachedItems.Add((command.CourseId, existingItem.Item2 + command.Quantity));
                }
                else
                {
                    // اگر دوره جدید است، اضافه می‌کنیم
                    cachedItems.Add((command.CourseId, command.Quantity));
                }

                cache.Set(basketId, cachedItems, TimeSpan.FromDays(7));
                await basketCommandRepository.CommitAsync();
                return await OkAsync("Add Course To Basket Success");

            }
            catch
            {
                return await ResultAsync($"Add Course To Basket Has Error.",
                    ApplicationServiceStatus.Exception);

            }
        }
    }
}
