using Framework.Src.Core.Contracts.Data.Commands;
using Framework.Src.Core.Contracts.Data.Queries;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace Framework.Src.Endpoints.Web.Extensions.DI
{
    /// <summary>
    /// توابع کمکی جهت ثبت نیازمندی‌های لایه داده
    /// </summary>
    public static class AddDataAccessExtensions
    {
        public static IServiceCollection AddArkaSoftwareDataAccess(
            this IServiceCollection services,
            IEnumerable<Assembly> assembliesForSearch) =>
            services.AddRepositories(assembliesForSearch).AddUnitOfWorks(assembliesForSearch);

        public static IServiceCollection AddRepositories(this IServiceCollection services,
            IEnumerable<Assembly> assembliesForSearch) =>
            services.AddWithTransientLifetime(assembliesForSearch, typeof(ICommandRepository<,>), typeof(IQueryRepository));

        public static IServiceCollection AddUnitOfWorks(this IServiceCollection services,
            IEnumerable<Assembly> assembliesForSearch) =>
            services.AddWithTransientLifetime(assembliesForSearch, typeof(IUnitOfWork));
    }
}
