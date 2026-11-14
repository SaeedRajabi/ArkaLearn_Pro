using Framework.Src.Core.Contracts.ApplicationService.Commands;
using Framework.Src.Core.Contracts.ApplicationService.Events;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace Framework.Src.Endpoints.Web.Extensions.Common
{
    public static class HttpContextExtensions
    {
        public static ICommandDispatcher CommandDispatcher(this HttpContext httpContext) =>
            (ICommandDispatcher)httpContext.RequestServices.GetService(typeof(ICommandDispatcher))!;

        public static IQueryDispatcher QueryDispatcher(this HttpContext httpContext) =>
            (IQueryDispatcher)httpContext.RequestServices.GetService(typeof(IQueryDispatcher))!;
        public static IDomainEventDispatcher EventDispatcher(this HttpContext httpContext) =>
            (IDomainEventDispatcher)httpContext.RequestServices.GetService(typeof(IDomainEventDispatcher))!;
        public static ArkaSoftwareCMPOutServices ArkaSoftwareApplicationContext(this HttpContext httpContext) =>
            (ArkaSoftwareCMPOutServices)httpContext.RequestServices.GetService(typeof(ArkaSoftwareCMPOutServices))!;
    }
}
