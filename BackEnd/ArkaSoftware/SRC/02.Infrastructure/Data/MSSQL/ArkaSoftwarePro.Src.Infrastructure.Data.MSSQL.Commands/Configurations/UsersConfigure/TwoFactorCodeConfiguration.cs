using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class TwoFactorCodeConfiguration : IEntityTypeConfiguration<TwoFactorCode>
    {
        public void Configure(EntityTypeBuilder<TwoFactorCode> builder)
        {
            builder.ToTable("TwoFactorCodes", "USER");
            builder.Property(x => x.Code).HasColumnType("VARCHAR").HasMaxLength(128).HasConversion(x => x!.Value, x => AuthenticateCode.CreateNew(120));
        }
    }
}
