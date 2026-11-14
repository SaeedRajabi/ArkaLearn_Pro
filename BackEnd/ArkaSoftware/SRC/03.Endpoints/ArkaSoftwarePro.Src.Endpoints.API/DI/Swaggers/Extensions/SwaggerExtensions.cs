using ArkaSoftwarePro.Src.Endpoints.API.DI.Swaggers.Extensions;
using ArkaSoftwarePro.Src.Endpoints.API.DI.Swaggers.Filters;
using ArkaSoftwarePro.Src.Endpoints.API.DI.Swaggers.Options;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Swashbuckle.AspNetCore.SwaggerUI;

namespace ArkaSoftwarePro.Src.Endpoints.API.DI.Swaggers.Extensions
{
    public static class SwaggerExtensions
    {
        private static bool IsSwaggerEnabled(IConfiguration configuration, string sectionName, IWebHostEnvironment environment)
        {
            if (!environment.IsDevelopment())
                return false;

            var swaggerOption = configuration.GetSection(sectionName).Get<SwaggerOption>();
            return swaggerOption is { Enable: true, SwaggerDoc: not null };
        }

        public static IServiceCollection AddSwagger(
            this IServiceCollection services,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            string sectionName)
        {
            if (!IsSwaggerEnabled(configuration, sectionName, environment))
                return services;

            var swaggerOption = configuration.GetSection(sectionName).Get<SwaggerOption>()!;
            services.AddSwaggerGen(option =>
            {
                    
                    option.SwaggerDoc(swaggerOption.SwaggerDoc.Name, new OpenApiInfo
                    {
                        Title = swaggerOption.SwaggerDoc.Title,
                        Version = swaggerOption.SwaggerDoc.Version,
                        Description = "API for managing various resources",
                        Contact = new OpenApiContact
                        {
                            Name = "Saeed Rajabi",
                            Email = "arkasoftware@gmail.com",
                            Url = new Uri("https://arkasoftware.ir")
                        }
                    });
                    var xmlFile = Path.Combine(AppContext.BaseDirectory, "ArkaSoftwarePro.Src.Endpoints.API.xml");
                    if (File.Exists(xmlFile))
                    {
                        try { option.IncludeXmlComments(xmlFile); }
                        catch { /* نادیده گرفتن خطای XML در صورت خرابی یا ناسازگاری */ }
                    }
                    option.ResolveConflictingActions(apiDescription => apiDescription.First());
                    option.MapType<IFormFile>(() => new OpenApiSchema { Type = "string", Format = "binary" });
                    option.MapType<IFormFile[]>(() => new OpenApiSchema { Type = "array", Items = new OpenApiSchema { Type = "string", Format = "binary" } });
                    var oAuthOption = configuration.GetSection("OAuth").Get<SwaggerOAuthOption>();
                    if (oAuthOption != null && oAuthOption.Enabled == true
                        && !string.IsNullOrWhiteSpace(oAuthOption.AuthorizationUrl)
                        && !string.IsNullOrWhiteSpace(oAuthOption.TokenUrl))
                    {
                        option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                        {
                            Scheme = "Bearer",
                            Name = "Authorization",
                            Description = "Bearer Authentication with JWT Token",
                            BearerFormat = "Bearer <token>",
                            In = ParameterLocation.Header,
                            Type = SecuritySchemeType.Http,
                            Flows = new OpenApiOAuthFlows
                            {
                                AuthorizationCode = new OpenApiOAuthFlow
                                {
                                    AuthorizationUrl = new Uri(oAuthOption.AuthorizationUrl),
                                    TokenUrl = new Uri(oAuthOption.TokenUrl),
                                    Scopes = oAuthOption.Scopes ?? new Dictionary<string, string>()
                                }
                            }
                        });
                        option.OperationFilter<AddParamsToHeader>();
                    }

                });

            return services;
        }


        public static void UseSwaggerUI(this WebApplication app, string sectionName)
        {
            if (!IsSwaggerEnabled(app.Configuration, sectionName, app.Environment))
                return;

            var swaggerOption = app.Configuration.GetSection(sectionName).Get<SwaggerOption>()!;
            app.UseSwagger();
            app.UseSwaggerUI(option =>
            {
                    option.DocExpansion(DocExpansion.None);
                    option.SwaggerEndpoint(swaggerOption.SwaggerDoc.URL, swaggerOption.SwaggerDoc.Title);
                    option.RoutePrefix = string.Empty;
                    option.OAuthUsePkce();
                    option.InjectStylesheet("/swagger/swaggerStyle.css");  // فایل CSS سفارشی

                });
        }



    }
}
