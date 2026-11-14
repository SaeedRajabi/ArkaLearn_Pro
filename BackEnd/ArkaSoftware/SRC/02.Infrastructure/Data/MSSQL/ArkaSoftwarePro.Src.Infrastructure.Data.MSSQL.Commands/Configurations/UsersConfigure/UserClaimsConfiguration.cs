using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class UserClaimsConfiguration : IEntityTypeConfiguration<UserClaim>
    {
        public void Configure(EntityTypeBuilder<UserClaim> builder)
        {
            builder.ToTable("UserClaims", "User");
            builder.Property(x => x.ClaimType).HasColumnType("VARCHAR").HasMaxLength(100).HasConversion(x => x.Value, x => new ClaimVT(x)).IsRequired();
            builder.Property(x => x.ClaimValue).HasColumnType("VARCHAR").HasMaxLength(700).HasConversion(x => x.Value, x => new ClaimVT(x)).IsRequired();
            builder.HasIndex(x => x.ClaimType);
        }
    }
}
