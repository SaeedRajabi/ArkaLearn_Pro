using ArkaSoftware.Utilities.SeriLogRegisteration.Extensions;
using ArkaSoftware.Utilities.SeriLogRegisteration.Extensions.DependencyInjection;
using ArkaSoftwarePro.Src.Endpoints.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

SerilogExtensions.RunWithSerilogExceptionHandling(() =>
{
    var applicationBuilder = WebApplication.CreateBuilder(args);
    var app = applicationBuilder.AddZaminSerilog(options =>
    {
        options.ApplicationName = applicationBuilder.Configuration.GetValue<string>("ApplicationName")!;
        options.ServiceId = applicationBuilder.Configuration.GetValue<string>("ServiceId")!;
        options.ServiceName = applicationBuilder.Configuration.GetValue<string>("ServiceName")!;
        options.ServiceVersion = applicationBuilder.Configuration.GetValue<string>("ServiceVersion")!;
    }).ConfigureService().ConfigurePipeline();
    app.Run();
});

