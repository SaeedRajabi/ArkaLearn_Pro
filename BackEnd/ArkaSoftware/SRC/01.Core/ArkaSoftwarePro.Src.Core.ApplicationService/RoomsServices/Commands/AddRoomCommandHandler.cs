using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRooms;
using Extensions.DependentyInjection.Abstractions;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands
{
    public class AddRoomCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices,
        IRoomCommandRepository roomCommandRepository,
        IHttpContextAccessor httpContextAccessor,
        IEntityTitleUniquenessChecker titleUniquenessChecker,
        IConfiguration configuration) : CommandHandler<AddRoomCommand, object>(mafiaOuterServices), IScopeLifetime
    {
        public override async Task<CommandResult<object>> Handle(AddRoomCommand command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var ownerUserId))
                    return await ResultAsync("User is not authenticated or invalid.", ApplicationServiceStatus.NotFound);

                if (await titleUniquenessChecker.RoomTitleExistsAsync(command.Title ?? string.Empty))
                {
                    AddMessage("A room with this title already exists.");
                    return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
                }

                var configuredOrigin = configuration["RoomDashboard:BaseUrl"]?.Trim();
                var requestOrigin = httpContextAccessor.HttpContext?.Request.Headers["Origin"].FirstOrDefault()?.Trim();
                var fallbackOrigin = !string.IsNullOrWhiteSpace(configuredOrigin)
                    ? configuredOrigin
                    : !string.IsNullOrWhiteSpace(requestOrigin)
                        ? requestOrigin
                        : "https://admin-dashboard.arkasoftware.ir";
                var baseUrl = string.IsNullOrWhiteSpace(command.BaseUrl)
                    ? fallbackOrigin
                    : RoomEntryLinkBuilder.NormalizeOrigin(command.BaseUrl);
                var slug = string.IsNullOrWhiteSpace(command.Slug) ? Guid.NewGuid().ToString("N")[..8] : command.Slug!.Trim().ToLowerInvariant();
                var room = new Room(
                    command.Title!,
                    command.RoomCapacity,
                    baseUrl,
                    slug,
                    command.IsGuest,
                    command.GuestQuantity,
                    command.FirstAdminInput,
                    command.TeacherEntersFirst,
                    command.MaxSessionTime,
                    command.Status,
                    ownerUserId
                );
                await roomCommandRepository.InsertAsync(room);
                await roomCommandRepository.CommitAsync();
                var roomLink = RoomEntryLinkBuilder.Normalize(room.ClassRoomLink?.Link, room.Slug, baseUrl);
                return await OkAsync(new
                {
                    title = room.Title,
                    roomId = room.Id,
                    roomCode = room.RoomCode,
                    roomLink,
                    slug = room.Slug
                });
            }
            catch (Exception)
            {
                return await ResultAsync("Add Room Is Error...", Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
