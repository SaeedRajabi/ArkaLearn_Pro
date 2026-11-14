using AutoMapper;
using ArkaSoftware.Extensions.Translations.Parrot.Extensions.DI;
using ArkaSoftwarePro.Src.Endpoints.API.Extensions;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Mapping;
using Extensions.ObjectMappers.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class MappingRegistrationTests
{
    public sealed class Source { public string Name { get; set; } = string.Empty; }
    public sealed class Target { public string Name { get; set; } = string.Empty; }
    public sealed class TestProfile : Profile
    {
        public TestProfile() => CreateMap<Source, Target>();
    }
    [Fact]
    public void RegisteredAdapterCanResolveAndMapUsingUpdatedAutoMapper()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["AutoMapperAssembly:AssmblyNamesForLoadProfiles"] = "ArkaSoftwarePro"
        }).Build();
        var services = new ServiceCollection().AddLogging().AddApplicationMapping(configuration, typeof(TestProfile).Assembly);
        services.AddArkaSoftwareParrotTranslator(configuration, "ParrotTranslator");
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var adapter = scope.ServiceProvider.GetRequiredService<IMapperAdapter>();
        Assert.Equal("Arka", adapter.Map<Source, Target>(new Source { Name = "Arka" }).Name);
        scope.ServiceProvider.GetRequiredService<IMapper>().ConfigurationProvider.AssertConfigurationIsValid();
    }
}
