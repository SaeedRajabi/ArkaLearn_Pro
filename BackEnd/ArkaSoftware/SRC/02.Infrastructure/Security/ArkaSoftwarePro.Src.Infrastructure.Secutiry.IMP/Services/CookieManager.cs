using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Factories;
using Microsoft.Extensions.Hosting;
using ICookieManager = ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts.ICookieManager;

namespace ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Services
{
    public class CookieManager(IHttpContextAccessor httpContextAccessor, IConfiguration configuration, IWebHostEnvironment hostEnvironment)
        : ICookieManager
    {
        public async Task SetAuthCookieAsync(object userInput , string token)
        {
            var user = AuthUserAdapterFactory.Create(userInput);
            var claims = new List<Claim>
            {
                new("userId", user!.Id.ToString()),
                new(ClaimTypes.NameIdentifier, user!.Id.ToString()),
                new(ClaimTypes.Name, user!.UserName),                    
                new(ClaimTypes.Email, user!.Email),
                new(ClaimTypes.GivenName, user!?.FirstName ?? "Unknown"), 
                new(ClaimTypes.Surname, user!?.LastName ?? "Unknown"),
                new(ClaimTypes.Sid, user!.BusinessId.ToString()),
                new(ClaimTypes.Role, user!.Role.ToString())
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            
            // تنظیمات کوکی:
            // چون از Next.js Proxy استفاده می‌کنیم، درخواست‌ها Same-Origin دیده می‌شوند.
            // بنابراین SameSite=Lax مناسب‌ترین و امن‌ترین گزینه است.
            // اگر روی لوکال هستیم و HTTP، باید Secure=false باشد.
            var isDevelopment = hostEnvironment.IsDevelopment();
            var isHttps = httpContextAccessor.HttpContext?.Request.IsHttps ?? false;
            
            // برای درخواست‌های Cross-Origin (مثل فرانت روی پورت 3000 و بک‌اند روی 5001)
            // همیشه SameSite=None و Secure=true تنظیم می‌کنیم تا در همه حالت‌ها (حتی پشت پروکسی) کار کند.
            // مرورگرها روی localhost کوکی‌های Secure را حتی روی HTTP هم قبول می‌کنند.
            var sameSite = SameSiteMode.None; 
            var secure = true;

            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTime.UtcNow.AddMinutes(GetSessionLifetimeMinutes()),
                AllowRefresh = true
            };

            var httpContext = httpContextAccessor.HttpContext;
            if (httpContext != null)
            {
                // لاگین سیستم Identity (کوکی اصلی AspNetCore.Cookies)
                await httpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity),
                    authProperties);


                // کوکی توکن (AuthCookie) برای استفاده‌های خاص (اگر نیاز است جدا باشد)
                // نکته: اگر سیستم Identity به درستی تنظیم شده باشد، شاید نیازی به این کوکی دوم نباشد
                // اما طبق کد موجود، این کوکی ست می‌شود.
                httpContext.Response.Cookies.Append("authToken", token, new CookieOptions
                {
                    HttpOnly = true, // امنیت در برابر XSS
                    Secure = secure,
                    SameSite = sameSite,
                    Expires = DateTime.UtcNow.AddMinutes(GetSessionLifetimeMinutes()),
                    Path = "/" // در دسترس برای همه مسیرها
                });
            }
        }

        private int GetSessionLifetimeMinutes()
        {
            var jwtMinutes = configuration.GetValue<int?>("Jwt:JwtLifetimeMinutes");
            if (jwtMinutes is > 0) return jwtMinutes.Value;

            var cookieMinutes = configuration.GetValue<int?>("Cookie:ExpireTime");
            if (cookieMinutes is > 0) return cookieMinutes.Value;

            return 300;
        }

        public string? GetAuthToken()
        {
            var httpContext = httpContextAccessor.HttpContext;
            if (httpContext != null && httpContext.Request.Cookies.TryGetValue("authToken", out var token))
            {
                return token;
            }
            return null;
        }

        public bool IsAuthenticated()
        {
            var httpContext = httpContextAccessor.HttpContext;
            return httpContext?.User.Identity?.IsAuthenticated == true;
        }

        public ClaimsPrincipal? GetAuthenticatedUser()
        {
            var httpContext = httpContextAccessor.HttpContext;
            return httpContext?.User.Identity?.IsAuthenticated == true ? httpContext.User : null;
        }

        public async Task LogoutAsync()
        {
            var httpContext = httpContextAccessor.HttpContext;
            if (httpContext != null)
            {
                await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

                var deleteOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Path = "/",
                    Expires = DateTimeOffset.UnixEpoch,
                };

                httpContext.Response.Cookies.Delete("authToken", deleteOptions);
                httpContext.Response.Cookies.Delete("AuthCookie", deleteOptions);
            }
        }
    }
}
