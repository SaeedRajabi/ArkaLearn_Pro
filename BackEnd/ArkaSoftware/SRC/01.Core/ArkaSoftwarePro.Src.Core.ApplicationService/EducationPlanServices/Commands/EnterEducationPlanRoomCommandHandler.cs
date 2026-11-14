using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.EnterEducationPlanRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Commands;

public class EnterEducationPlanRoomCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEducationPlanQueryRepository planRepository,
    IUserQueryRepository userQueryRepository,
    IManagedRoomStudentCommandRepository managedRoomStudentRepository,
    IRoomCommandRepository roomCommandRepository,
    IJwtGenerator jwtGenerator,
    IConfiguration configuration)
    : CommandHandler<EnterEducationPlanRoomCommand, EnterEducationPlanRoomResult>(outer)
{
    public override async Task<CommandResult<EnterEducationPlanRoomResult>> Handle(EnterEducationPlanRoomCommand command)
    {
        if (command.UserId <= 0 || command.PlanId <= 0)
        {
            result.AddMessage("Invalid plan or user.");
            return await ResultAsync(new EnterEducationPlanRoomResult(), ApplicationServiceStatus.ValidationError);
        }

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.UserId });
        if (user == null)
        {
            result.AddMessage("User account was not found.");
            return await ResultAsync(new EnterEducationPlanRoomResult(), ApplicationServiceStatus.ValidationError);
        }

        var email = (user.Email ?? string.Empty).Trim();
        var userName = (user.UserName ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(email) && string.IsNullOrEmpty(userName))
        {
            result.AddMessage("Your account must have a username or email to enter the online room.");
            return await ResultAsync(new EnterEducationPlanRoomResult(), ApplicationServiceStatus.ValidationError);
        }

        var studentIds = await planRepository.ResolveManagedStudentIdsForUserAsync(
            command.UserId,
            userName,
            string.IsNullOrEmpty(email) ? null : email);

        var plan = await planRepository.GetEducationPlanForStudentAsync(command.PlanId, studentIds);
        if (plan == null)
        {
            result.AddMessage("Education plan was not found.");
            return await ResultAsync(new EnterEducationPlanRoomResult(), ApplicationServiceStatus.NotFound);
        }

        var isActive = await planRepository.IsPlanActiveAsync(command.PlanId);
        if (!isActive)
        {
            result.AddMessage("This education plan is not active, has no remaining time, or an installment payment is overdue.");
            return await ResultAsync(new EnterEducationPlanRoomResult(), ApplicationServiceStatus.ValidationError);
        }

        var room = await roomCommandRepository.GetWithRoomUsersAsync(plan.RoomId);
        if (room == null)
        {
            result.AddMessage("Online room was not found.");
            return await ResultAsync(new EnterEducationPlanRoomResult(), ApplicationServiceStatus.NotFound);
        }

        var managed =
            await managedRoomStudentRepository.GetByIdOrDefaultAsync(plan.ManagedRoomStudentId)
            ?? await managedRoomStudentRepository.FindActiveByUserNameOrEmailAsync(
                userName,
                string.IsNullOrEmpty(email) ? null : email);

        if (managed != null)
        {
            try
            {
                room.AssignOrSyncManagedStudentSeat(managed, user.Avatar);
                await roomCommandRepository.CommitAsync();
                room = await roomCommandRepository.GetWithRoomUsersAsync(plan.RoomId) ?? room;
            }
            catch (InvalidEntityStateException)
            {
                // Seat may already exist under another link; resolve below by login keys.
            }
        }

        var roomUser =
            room.RoomUsers.FirstOrDefault(ru =>
                !ru.IsDelete && ru.ManagedRoomStudentId == plan.ManagedRoomStudentId)
            ?? FindSeatInRoom(room, email, userName);

        if (roomUser == null && managed != null)
            roomUser = room.FindRoomUserForLogin(managed.UserName.Value);

        if (roomUser == null && !IsSeatInRoom(room, email, userName))
        {
            var firstName = string.IsNullOrWhiteSpace(user.FirstName) ? userName : user.FirstName;
            var lastName = string.IsNullOrWhiteSpace(user.LastName) ? "--" : user.LastName;
            var loginUserName = string.IsNullOrEmpty(email) ? userName : email;
            room.AddUserRoom(firstName, lastName, loginUserName, GenerateStrongPassword());
            await roomCommandRepository.CommitAsync();
            room = await roomCommandRepository.GetWithRoomUsersAsync(plan.RoomId) ?? room;
            roomUser = FindSeatInRoom(room, email, userName);
        }

        if (roomUser == null)
        {
            result.AddMessage(
                "No room seat is linked to your account for this plan. Ask your instructor to add you to the room.");
            return await ResultAsync(new EnterEducationPlanRoomResult(), ApplicationServiceStatus.ValidationError);
        }

        if (roomUser.IsBlocked)
        {
            result.AddMessage("Your seat in this room is blocked.");
            return await ResultAsync(new EnterEducationPlanRoomResult(), ApplicationServiceStatus.ValidationError);
        }

        var token = jwtGenerator.GenerateJwtToken(roomUser);
        var dashboardOrigin = configuration["RoomDashboard:BaseUrl"]?.Trim() ?? "https://admin-dashboard.arkasoftware.ir";
        var roomLink = RoomEntryLinkBuilder.Normalize(room.ClassRoomLink?.Link, room.Slug, dashboardOrigin);

        return await ResultAsync(
            new EnterEducationPlanRoomResult
            {
                RoomLink = roomLink,
                Token = token,
                UserId = roomUser.Id.ToString(),
                UserName = roomUser.UserName?.Value ?? userName,
                DisplayName = $"{roomUser.Name?.FirstName} {roomUser.Name?.LastName}".Trim(),
                AvatarUrl = string.IsNullOrWhiteSpace(roomUser.PhotoUrl) ? user.Avatar : roomUser.PhotoUrl,
                Email = string.IsNullOrEmpty(email) ? roomUser.Email : email,
                Role = "student",
            },
            ApplicationServiceStatus.Ok);
    }

    private static RoomUser? FindSeatInRoom(Room room, string email, string userName)
    {
        if (!string.IsNullOrEmpty(email))
        {
            var byEmail = room.FindRoomUserForLogin(email);
            if (byEmail != null) return byEmail;
        }

        if (!string.IsNullOrEmpty(userName))
            return room.FindRoomUserForLogin(userName);

        return null;
    }

    private static bool IsSeatInRoom(Room room, string email, string userName)
        => FindSeatInRoom(room, email, userName) != null;

    private static string GenerateStrongPassword(int length = 14)
    {
        const string chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
        var bytes = new byte[length];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        var result = new char[length];
        for (var i = 0; i < length; i++)
            result[i] = chars[bytes[i] % chars.Length];
        return new string(result);
    }
}
