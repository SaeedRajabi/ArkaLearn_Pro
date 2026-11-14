using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.RoomsConfigure
{
    public class RoomUserConfiguration : IEntityTypeConfiguration<RoomUserQueryModel>
    {
        public void Configure(EntityTypeBuilder<RoomUserQueryModel> builder)
        {
            builder.ToTable("RoomUsers", "Room");
            builder.HasKey(x => x.UserId).HasName("Id");
            builder.Property(x => x.UserId).HasColumnName("Id");
            builder.Property(x => x.RoomId).HasColumnName("RoomId").HasColumnType("BIGINT");
            builder.Property(x => x.FirstName).HasColumnName("FirstName").HasMaxLength(80);
            builder.Property(x => x.LastName).HasColumnName("LastName").HasMaxLength(80);
            builder.Property(x => x.IsOnline).HasColumnName("IsOnline").HasMaxLength(80);
            builder.Property(x => x.UserName).HasColumnName("UserName").HasMaxLength(100);
            builder.Property(x => x.Email).HasColumnName("Email").HasMaxLength(256);
            builder.Property(x => x.PhotoUrl).HasColumnName("PhotoUrl").HasMaxLength(600);
            builder.Property(x => x.ManagedRoomStudentId).HasColumnName("ManagedRoomStudentId");
            builder.Property(x => x.IsBlocked).HasColumnName("IsBlocked");
            builder.Property(x => x.CreateAt).HasColumnName("CreatedDateTime");

            builder.HasOne(x => x.Room).WithMany(x => x.RoomUsers).HasForeignKey(x => x.RoomId).HasConstraintName("FK_RoomUsers_Rooms_RoomId");
        }
    }
}
