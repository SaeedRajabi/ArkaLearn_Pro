using ArkaSoftwarePro.Src.Infrastructure.Integrations.Mapping;
using AutoMapper;
using Extensions.ObjectMappers.Abstractions;
using System.Reflection;

namespace ArkaSoftwarePro.Src.Endpoints.API.Extensions;

public static class MappingRegistration
{
    public static IServiceCollection AddApplicationMapping(this IServiceCollection services, IConfiguration configuration,
        params Assembly[] additionalAssemblies)
    {
        var configured = configuration.GetSection("AutoMapper:ProfileAssemblies").Get<string[]>() ?? [];
        var assemblies = configured.Select(Assembly.Load).Concat(additionalAssemblies)
            .Append(typeof(MappingRegistration).Assembly).ToHashSet();
        // Existing installations configure assembly-name prefixes, not assembly filenames.
        var prefixes = (configuration["AutoMapperAssembly:AssmblyNamesForLoadProfiles"] ?? "ArkaSoftwarePro")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var pending = new Queue<Assembly>(assemblies);
        while (pending.TryDequeue(out var assembly))
        {
            foreach (var name in assembly.GetReferencedAssemblies().Where(name =>
                         prefixes.Any(prefix => name.Name?.StartsWith(prefix, StringComparison.Ordinal) == true)))
            {
                var referenced = Assembly.Load(name);
                if (assemblies.Add(referenced)) pending.Enqueue(referenced);
            }
        }
        services.AddAutoMapper(options => options.LicenseKey = configuration["AutoMapper:LicenseKey"], assemblies.ToArray());
        services.AddScoped<IMapperAdapter, AutoMapperAdapter>();
        return services;
    }
}
