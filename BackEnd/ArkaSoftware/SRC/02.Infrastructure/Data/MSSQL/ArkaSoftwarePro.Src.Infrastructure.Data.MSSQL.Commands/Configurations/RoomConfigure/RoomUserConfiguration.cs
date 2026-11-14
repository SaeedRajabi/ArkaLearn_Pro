using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.RoomConfigure
{
    public class RoomUserConfiguration : IEntityTypeConfiguration<RoomUser>
    {
        public void Configure(EntityTypeBuilder<RoomUser> builder)
        {
            builder.ToTable("RoomUsers", "Room");
            builder.Property(x => x.UserName).HasMaxLength(100).HasColumnType("VARCHAR").HasConversion(x => x!.Value, x => new UserName(x)).IsRequired();
            builder.Property(x => x.Email).HasMaxLength(256);
            builder.Property(x => x.PhotoUrl).HasMaxLength(600);
            builder.Property(x => x.ManagedRoomStudentId);
            builder.Property(x => x.IsBlocked).HasDefaultValue(false);
            builder.HasOne<ManagedRoomStudent>()
                .WithMany()
                .HasForeignKey(x => x.ManagedRoomStudentId)
                .OnDelete(DeleteBehavior.SetNull);
            builder.OwnsOne(x => x.Password, password =>
            {
                password.Property(pass => pass.HashedPassword).HasColumnName("HashPassword").HasColumnType("VARCHAR").HasMaxLength(256).IsRequired();
                password.Property(pass => pass.Salt).HasColumnName("SaltPassword").HasColumnType("VARCHAR").HasMaxLength(256).IsRequired();
            });
            builder.OwnsOne(x => x.Name, fullName =>
            {
                // Required non-shared props so EF can always materialize the owned type.
                fullName.Property(fName => fName.FirstName).HasColumnName("FirstName").HasMaxLength(80).IsRequired();
                fullName.Property(fName => fName.LastName).HasColumnName("LastName").HasMaxLength(80).IsRequired();
                fullName.HasIndex(x => x.FirstName);
                fullName.HasIndex(x => x.LastName);
            });
            builder.Navigation(x => x.Name).IsRequired();
        }
    }
}
