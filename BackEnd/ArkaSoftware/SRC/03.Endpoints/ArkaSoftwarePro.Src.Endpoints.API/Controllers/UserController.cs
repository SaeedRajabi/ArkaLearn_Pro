using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ResetPassword;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.RequestPasswordReset;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AddUsers;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByToken;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.UpdateUserFullName;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.SetTwoFactorEnabled;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ChangePassword;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.SetUserStatus;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.DeleteUser;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminUpdateUser;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByCookie;
using Framework.Src.Core.RequestResponse.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.SearchUsersByInputValue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByUserNameOrEmail;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class UserController : BaseController
    {
        private readonly FileStoragePathSaver _pathSaver;

        public UserController(FileStoragePathSaver pathSaver)
        {
            _pathSaver = pathSaver;
        }

        [HttpPost("Create")]
        public async Task<IActionResult> AddUser(AddUser user)
        {
            return await Create<AddUser, object>(user);
        }

        [HttpPost("RequestPasswordReset")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetCommand command)
            => await Create<RequestPasswordResetCommand, string>(command);

        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command)
            => await Create<ResetPasswordCommand, string>(command);
        /// <summary>
        /// 
        /// </summary>
        /// <param name="userQuery"></param>
        /// <returns></returns>
        [HttpGet("GetById")]
        public async Task<IActionResult> GetUserById([FromQuery] GetUserByIdQuery userQuery) 
            => await Query<GetUserByIdQuery, UserQr?>(userQuery);


        
        
        [HttpGet("GetByUserNameOrEmail")]
        public async Task<IActionResult> GetUserByUserNameOrEmail([FromQuery] GetUserByUserNameOrEmailQuery userQuery) 
            => await Query<GetUserByUserNameOrEmailQuery, GetUserByUserNameOrEmailQri>(userQuery);



        
        [HttpGet("GetUser")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetUser()
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            return await Query<GetUserByTokenQuery, UserByTokenQri?>(new GetUserByTokenQuery { Token = token });
        }




        /// <summary>
        /// دریافت اطلاعات کاربر احراز هویت شده
        /// </summary>
        [HttpGet("get-user")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetUserByCookie()
        {
            // بررسی اینکه آیا کاربر احراز هویت شده است
            if (User.Identity?.IsAuthenticated != true)
            {
                return Unauthorized(new { message = "User is not authenticated." });
            }

            // بررسی وجود `Claims` (Cookie/JWT از ClaimTypes.Name استفاده می‌کنند)
            var nameClaim = User.Claims.FirstOrDefault(x => x.Type == System.Security.Claims.ClaimTypes.Name || x.Type == "name");
            if (nameClaim == null)
            {
                return BadRequest("User claim not found.");
            }
            var userName = new GetUserByCookieQuery { userName = nameClaim.Value };
            return await Query<GetUserByCookieQuery, GetUserByCookieQri>(userName);

        }

        /// <summary>
        /// تأیید سبک نشست (کوکی/JWT) بدون بارگذاری پروفایل کامل — برای ورود به اتاق زنده.
        /// </summary>
        [HttpGet("verify-session")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public IActionResult VerifySession()
        {
            if (User.Identity?.IsAuthenticated != true)
                return Unauthorized(new { valid = false, message = "User is not authenticated." });

            var nameClaim = User.Claims.FirstOrDefault(x => x.Type == System.Security.Claims.ClaimTypes.Name || x.Type == "name");
            if (nameClaim == null)
                return Unauthorized(new { valid = false, message = "User claim not found." });

            return Ok(new { valid = true });
        }


        /// <summary>
        /// برای بروزرسانی نام و نام خوانوادگی کاربر این نقطه پایانی صدا زده میشه
        /// </summary>
        [HttpPost("UpdateUserFN")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateUserFullName(UpdateUserFullNameCommand userFullName)
        {
            return await Edit<UpdateUserFullNameCommand, string>(userFullName);
        }

        [HttpPost("SetTwoFactorEnabled")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SetTwoFactorEnabled([FromBody] SetTwoFactorEnabledCommand command)
            => await Edit<SetTwoFactorEnabledCommand, string>(command);

        [HttpPost("ChangePassword")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
            => await Edit<ChangePasswordCommand, string>(command);

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpPost("UploadProfileImage")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UploadProfileImage([FromForm] IFormFile? profileImage)
        {
            if (profileImage == null || profileImage.Length == 0)
                return BadRequest(new { message = "No profile image uploaded." });

            if (!User.TryGetLongUserId(out var userId))
                return Unauthorized(new { message = "User is not authenticated." });

            var userCommandRepository = HttpContext.RequestServices.GetRequiredService<IUserCommandRepository>();
            var currentUser = await userCommandRepository.GetAsync(userId);
            if (currentUser == null)
                return NotFound(new { message = $"User with id {userId} was not found." });

            var imageUrl = await _pathSaver.SavePublicAsync(profileImage, "images/usersProfile");
            currentUser.ChangeProfileImage(imageUrl);
            await userCommandRepository.CommitAsync();

            return Ok(new { imageUrl });
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpPost("UploadHeaderImage")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UploadHeaderImage([FromForm] IFormFile? headerImage)
        {
            if (headerImage == null || headerImage.Length == 0)
                return BadRequest(new { message = "No header image uploaded." });

            if (!User.TryGetLongUserId(out var userId))
                return Unauthorized(new { message = "User is not authenticated." });

            var userCommandRepository = HttpContext.RequestServices.GetRequiredService<IUserCommandRepository>();
            var currentUser = await userCommandRepository.GetAsync(userId);
            if (currentUser == null)
                return NotFound(new { message = $"User with id {userId} was not found." });

            var imageUrl = await _pathSaver.SavePublicAsync(headerImage, "images/dashboardHeaders");
            return Ok(new { imageUrl });
        }



        /// <summary>
        /// این نقطه پایانی برای جستجوی کاربران صدا زده میشه و جستجو بر اساس صفحه بندی انجام میشه.
        /// </summary>
        /// <param name="userQuery">ورودی یک شی از کاربر شامل مقدار عبارت جستجو و تعداد صفحه و مرتب سازی کردن یا نکردن و موارد دیگه رو میگیره</param>
        /// <returns>در نهایت لیستی از کاربران که پیدا کرده رو بر میگردونه و میتونه نال یا خالی هم بر گردونه.</returns>
        [HttpGet("Search")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchUsers([FromQuery] SearchUsersByInputValueQuery userQuery)
            => await Query<SearchUsersByInputValueQuery, PagedData<SearchUsersByInputValueQri>>(userQuery);

        [HttpPost("SetStatus")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SetUserStatus([FromBody] SetUserStatusCommand command)
            => await Edit<SetUserStatusCommand, string>(command);

        [HttpPost("Delete")]
        [HttpPost("Remove")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteUser(
            [FromBody] DeleteUserCommand? command,
            [FromQuery] long? userId)
        {
            var resolvedUserId = command?.UserId ?? userId ?? 0;
            if (resolvedUserId <= 0)
                return BadRequest(new { message = "UserId is required." });

            return await Edit<DeleteUserCommand, string>(new DeleteUserCommand { UserId = resolvedUserId });
        }

        [HttpPost("AdminUpdate")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AdminUpdateUser([FromBody] AdminUpdateUserCommand command)
            => await Edit<AdminUpdateUserCommand, string>(command);

        #region Clear GC Methods
        
        /// <summary>
        /// استفاده میشه GC این نقطه پایانی برای پاک سازی
        /// </summary>
        /// <returns>خروجی تایید رو بر میگردونه</returns>
        [HttpGet("Clear")]
        public bool Clear()
        {
            GC.Collect(2);
            return true;
        }
        #endregion
    }
}
