using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.UsersConfigure
{
    public class UserConfiguration : IEntityTypeConfiguration<UserQueryModel>
    {
        public void Configure(EntityTypeBuilder<UserQueryModel> builder)
        {
            builder.ToTable("Users", "User");
            builder.Property(x => x.Id).HasColumnType("BIGINT").HasColumnName("Id");
            builder.Property(x => x.UserName).HasColumnName("UserName");
            builder.Property(x => x.Email).HasColumnName("Email");
            builder.Property(x => x.FirstName).HasColumnName("FirstName");
            builder.Property(x => x.LastName).HasColumnName("LastName");
            builder.Property(x => x.PhoneNumber).HasColumnName("PhoneNumber_Number");
            builder.Property(x => x.PhoneCountryCode).HasColumnName("PhoneNumber_CountryCode");
            builder.Property(x => x.DateOfBirth).HasColumnName("DateOfBirth");
            builder.Property(x => x.BusinessId).HasColumnName("BusinessId");
            builder.Property(x => x.ProfileImage).HasColumnName("ProfileImage");
            builder.Property(x => x.Status).HasColumnName("Status");
            builder.Property(x => x.Role).HasColumnName("Role");
            builder.Property(x => x.CreateAt).HasColumnName("CreatedDateTime");
            builder.Property(x => x.EmailVerified).HasColumnName("EmailVerified");
            builder.Property(x => x.PhoneNumberVerified).HasColumnName("PhoneNumberVerified");
            builder.Property(x => x.TwoFactorEnable).HasColumnName("TwoFactorEnabled");
        }
    }
}
