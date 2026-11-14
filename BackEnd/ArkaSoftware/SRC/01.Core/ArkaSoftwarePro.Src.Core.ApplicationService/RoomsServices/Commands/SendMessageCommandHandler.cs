using ArkaSoftwarePro.Src.Core.Contracts.Messages.IHubs;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Commands.SendMessage;
using Extensions.DependentyInjection.Abstractions;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Extensions.Chaching.Abstractions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands
{
    public class SendMessageCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IRoomCommandRepository roomCommandRepository, 
        IChatMessageHub chatMessageHub,
        IHttpContextAccessor httpContextAccessor,
        ICacheAdapter cacheAdapter,
        ArkaSoftwarePro.Src.Core.Contracts.Rooms.IRoomAccessService roomAccess
        ) : CommandHandler<SendMessageCommand, string>(mafiaOuterServices) , IScopeLifetime
    {
        public override async Task<CommandResult<string>> Handle(SendMessageCommand command)
        {
            try
            {
                var user = httpContextAccessor.HttpContext?.User;
                if (!await roomAccess.CanAccessAsync(command.RoomId, user))
                    return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
                if (string.IsNullOrWhiteSpace(command.Text) || command.Text.Length > 4000)
                    return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
                var dataToCache = new
                {
                    text = command.Text,
                    roomId = command.RoomId,
                    isOnline=true,
                    sendTime = DateTime.Now.ToString("yyyy MMMM dd")
                };

                var redisKey = $"chats:{command.RoomId}:{Guid.NewGuid().ToString().Substring(0,5)}";

                cacheAdapter.Add(
                    redisKey,
                    dataToCache,
                    DateTime.Now.AddHours(5),
                    null
                );
                var roomResult = await roomCommandRepository.GetAsync(command.RoomId);
                if (roomResult == null!)
                    return await ResultAsync(null! , ApplicationServiceStatus.NotFound);
                roomResult.SendMessage(command.Text);
                await roomCommandRepository.CommitAsync();
                var fullName = user!.FindFirst(ClaimTypes.GivenName)?.Value;
                var userName = user.Identity?.Name;
                await chatMessageHub.SendMessageToRoom(Convert.ToString(command.RoomId), fullName ?? userName ?? "Unknown", command.Text);
                return await OkAsync("Message Added Success");
            }
            catch
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }
}
