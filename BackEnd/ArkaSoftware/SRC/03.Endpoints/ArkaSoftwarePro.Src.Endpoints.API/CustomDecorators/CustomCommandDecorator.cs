using System.Reflection;
using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;

namespace ArkaSoftwarePro.Src.Endpoints.API.CustomDecorators;

public class CustomCommandDecorator(IApplicationCacheService cacheService) : CommandDispatcherDecorator
{
    public override int Order => 0;

    public override async Task<CommandResult> Send<TCommand>(TCommand command)
    {
        var result = await _commandDispatcher.Send(command);
        await TryInvalidateAsync(command, result.Status);
        return result;
    }

    public override async Task<CommandResult<TData>> Send<TCommand, TData>(TCommand command)
    {
        var result = await _commandDispatcher.Send<TCommand, TData>(command);
        await TryInvalidateAsync(command, result.Status);
        return result;
    }

    private async Task TryInvalidateAsync<TCommand>(TCommand command, ApplicationServiceStatus status)
    {
        if (status != ApplicationServiceStatus.Ok)
            return;

        var attribute = typeof(TCommand).GetCustomAttribute<InvalidatesCacheAttribute>();
        if (attribute is null)
            return;

        foreach (var region in attribute.Regions)
            await cacheService.InvalidateRegionAsync(region);
    }
}
