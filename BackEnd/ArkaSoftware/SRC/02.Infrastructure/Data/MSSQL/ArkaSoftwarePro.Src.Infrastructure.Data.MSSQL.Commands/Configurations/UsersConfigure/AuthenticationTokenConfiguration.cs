using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class AuthenticationTokenConfiguration : IEntityTypeConfiguration<AuthenticationToken>
    {
        public void Configure(EntityTypeBuilder<AuthenticationToken> builder)
        {
            builder.ToTable("AuthenticationTokens", "User");
            builder.Property(x => x.Token).HasColumnType("VARCHAR").HasMaxLength(1300).HasConversion(x => x!.Value, x => Token.Create(x)).IsRequired();


        }
    }
}
