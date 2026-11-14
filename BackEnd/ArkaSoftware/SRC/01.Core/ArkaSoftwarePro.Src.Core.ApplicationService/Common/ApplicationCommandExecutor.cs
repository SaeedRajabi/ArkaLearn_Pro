using ArkaSoftwarePro.Src.Core.RequestResponse.Common;
using Framework.Src.Core.Contracts.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.Common;

public sealed class ApplicationCommandExecutor(ICommandDispatcher dispatcher)
{
    public async Task<FileOperationResult> Create<TCommand, TResult>(TCommand command)
        where TCommand : class, ICommand<TResult>
    {
        var result = await dispatcher.Send<TCommand, TResult>(command);
        return result.Status == ApplicationServiceStatus.Ok
            ? new(FileOperationOutcome.Created, result.Data)
            : FileOperationResult.Invalid(result.Messages);
    }

    public async Task<FileOperationResult> Edit<TCommand, TResult>(TCommand command)
        where TCommand : class, ICommand<TResult>
    {
        var result = await dispatcher.Send<TCommand, TResult>(command);
        return result.Status switch
        {
            ApplicationServiceStatus.Ok => FileOperationResult.Success(result.Data),
            ApplicationServiceStatus.NotFound => FileOperationResult.Missing(new { ErrorMessages = result.Data, JsonData = command }),
            _ => FileOperationResult.Invalid(result.Messages)
        };
    }
}
