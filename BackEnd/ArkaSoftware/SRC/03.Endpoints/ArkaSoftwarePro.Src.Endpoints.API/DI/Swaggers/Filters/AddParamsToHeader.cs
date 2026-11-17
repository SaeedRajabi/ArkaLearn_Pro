using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ArkaSoftwarePro.Src.Endpoints.API.DI.Swaggers.Filters
{
    /// <summary>
    /// 
    /// </summary>
    public class AddParamsToHeader : IOperationFilter
    {
        /// <summary>
        /// Adds the Bearer security requirement to every operation.
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="context"></param>
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            if (operation.Security == null)
                operation.Security = new List<OpenApiSecurityRequirement>();

            operation.Security ??= new List<OpenApiSecurityRequirement>();

            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", context.Document)] = new List<string>()
            });
        }
    }
}
