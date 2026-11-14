using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.RoomConfigure;

public class ManagedRoomStudentConfiguration : IEntityTypeConfiguration<ManagedRoomStudent>
{
    public void Configure(EntityTypeBuilder<ManagedRoomStudent> builder)
    {
        builder.ToTable("ManagedRoomStudents", "Room");
        builder.Property(x => x.FirstName).HasMaxLength(80).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(80).IsRequired();
        builder.Property(x => x.UserName).HasMaxLength(100).HasColumnType("VARCHAR")
            .HasConversion(v => v!.Value, v => new UserName(v)).IsRequired();
        builder.HasIndex(x => x.UserName).IsUnique().HasFilter("[IsDelete] = 0");
        builder.Property(x => x.Email).HasMaxLength(256);
        builder.HasIndex(x => x.Email).IsUnique()
            .HasFilter("[Email] IS NOT NULL AND [Email] <> N'' AND [IsDelete] = 0");
        builder.Property(x => x.Phone).HasMaxLength(40);
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.Gender).HasMaxLength(30);
        builder.Property(x => x.PhotoUrl).HasMaxLength(600);
        builder.OwnsOne(x => x.Password, password =>
        {
            password.Property(p => p.HashedPassword).HasColumnName("HashPassword").HasColumnType("VARCHAR").HasMaxLength(256).IsRequired();
            password.Property(p => p.Salt).HasColumnName("SaltPassword").HasColumnType("VARCHAR").HasMaxLength(256).IsRequired();
        });
    }
}
