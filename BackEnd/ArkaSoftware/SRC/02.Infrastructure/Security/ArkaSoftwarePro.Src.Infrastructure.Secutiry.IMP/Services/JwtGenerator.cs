using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Factories;


namespace ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Services
{
    public class JwtGenerator : IJwtGenerator
    {
        private readonly IJwtGeneratorSettings _jwtGeneratorSettings;
        private readonly SymmetricSecurityKey key;
        private readonly TokenValidationParameters _tokenValidationParameters;
        public JwtGenerator(IJwtGeneratorSettings jwtGeneratorSettings)
        {
            _jwtGeneratorSettings = jwtGeneratorSettings;
            var encodedKey = Encoding.UTF8.GetBytes(_jwtGeneratorSettings.JwtSignKey);
            key = new SymmetricSecurityKey(encodedKey);
            _tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _jwtGeneratorSettings.JwtIssuer,
                ValidAudience = _jwtGeneratorSettings.JwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtGeneratorSettings.JwtSignKey))
            };
        }

        public string GenerateJwtToken(object user)
        {
            return GenerateJwtToken(user!, _jwtGeneratorSettings.JwtLifetimeMinutes);
        }



        private string GenerateJwtToken(object userInput, int lifetimeMinutes)
        {
            var user = AuthUserAdapterFactory.Create(userInput);
            var claims = new List<Claim>
            {
                new("userId", user !.Id.ToString()),
                new(ClaimTypes.NameIdentifier, user!.Id.ToString()),
                new(ClaimTypes.Name, user.UserName),
                new(ClaimTypes.Email, user !.Email),
                new(ClaimTypes.GivenName, user !?.FirstName ?? "Unknown"),
                new(ClaimTypes.Surname, user !?.LastName ?? "Unknown"),
                new(ClaimTypes.Sid, user !.BusinessId.ToString()),
                new(ClaimTypes.Role, user !.Role.ToString())
            };
            if (userInput is ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities.RoomUser seat)
            {
                claims.Add(new Claim("identityScope", "room-seat"));
                claims.Add(new Claim("roomId", seat.RoomId.ToString()));
                claims.Add(new Claim("roomSeatId", seat.Id.ToString()));
            }
            if (!user!.ClaimExist())
            { 
                user!.AddClaims(claims);
            }
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(lifetimeMinutes),
                SigningCredentials = credentials,
                Issuer = _jwtGeneratorSettings.JwtIssuer,
                Audience = _jwtGeneratorSettings.JwtAudience,
            };
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        public ClaimsPrincipal ValidateToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var principal = tokenHandler.ValidateToken(token, _tokenValidationParameters, out var validatedToken);
                if (!(validatedToken is JwtSecurityToken jwtToken) || jwtToken.Header.Alg != SecurityAlgorithms.HmacSha256)
                    throw new SecurityTokenException("Invalid token");
                return principal;
            }
            catch (Exception)
            {
                return null!;
            }
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }


        public ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var parameters = _tokenValidationParameters.Clone();
            parameters.ValidateLifetime = false;
            try
            {
                var principal = tokenHandler.ValidateToken(token, parameters, out var securityToken);
                if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                    throw new SecurityTokenException("Invalid token");
                return principal;
            }
            catch
            {
                return null!;
            }
        }
    }
}
