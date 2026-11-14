using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {

            builder.ToTable("Users", "User");

            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).ValueGeneratedNever();
            builder.Property(x => x.UserName).HasMaxLength(100).HasColumnType("VARCHAR").HasConversion(x => x.Value, x => new UserName(x)).IsRequired();
            builder.OwnsOne(x => x.PasswordHash, password =>
            {
                password.Property(pass => pass.HashedPassword).HasColumnName("HashPassword").HasColumnType("VARCHAR").HasMaxLength(256);
                password.Property(pass => pass.Salt).HasColumnName("SaltPassword").HasColumnType("VARCHAR").HasMaxLength(256);
            });
            builder.Property(x => x.Email).HasMaxLength(80).HasColumnType("VARCHAR").HasConversion(x => x.Value, x => new Email(x)).IsRequired();
            builder.OwnsOne(x => x.UserFullName, fullName =>
            {
                // Required non-shared props so EF can always materialize the owned type.
                fullName.Property(fName => fName.FirstName).HasColumnName("FirstName").HasMaxLength(80).IsRequired();
                fullName.Property(fName => fName.LastName).HasColumnName("LastName").HasMaxLength(80).IsRequired();
                fullName.HasIndex(x => x.FirstName);
                fullName.HasIndex(x => x.LastName);
            });
            builder.Navigation(x => x.UserFullName).IsRequired();
            builder.OwnsOne(x => x.PhoneNumber, phoneNumber =>
            {
                phoneNumber.Property(tel => tel.CountryCode).HasMaxLength(5).HasColumnType("CHAR").HasColumnName("PhoneNumber_CountryCode");
                phoneNumber.Property(tel => tel.Number).HasMaxLength(12).HasColumnType("CHAR").HasColumnName("PhoneNumber_Number");
                phoneNumber.HasIndex(x => x.CountryCode);
                phoneNumber.HasIndex(x => x.Number).IsUnique();
            });
            builder.Property(x => x.Status).HasMaxLength(8).HasColumnType("CHAR").IsRequired();


            builder.HasIndex(x => x.UserName);
            builder.HasIndex(x => x.Email).IsUnique();


        }
    }
}
