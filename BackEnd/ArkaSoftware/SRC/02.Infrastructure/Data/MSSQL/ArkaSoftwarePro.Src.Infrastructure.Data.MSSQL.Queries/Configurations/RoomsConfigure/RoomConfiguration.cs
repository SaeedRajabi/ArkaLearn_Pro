using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.RoomsConfigure
{
    public class RoomConfiguration : IEntityTypeConfiguration<RoomQueryModel>
    {
        public void Configure(EntityTypeBuilder<RoomQueryModel> builder)
        {
            builder.ToTable("Rooms", "Room");
            builder.HasKey(x => x.RoomId).HasName("Id");
            builder.Property(x => x.RoomId).HasColumnName("Id").HasColumnType("BIGINT");
            builder.Property(x => x.Slug).HasColumnName("Slug").HasColumnType("VARCHAR").HasMaxLength(120);
            builder.Property(x => x.DefaultMediaFileId).HasColumnName("DefaultMediaFileId").HasColumnType("BIGINT");
            builder.Property(x => x.DefaultSlideFileId).HasColumnName("DefaultSlideFileId").HasColumnType("BIGINT");
            builder.Property(x => x.IsGuest).HasColumnName("IsGuest").HasColumnType("BIT");
            builder.Property(x => x.GuestQuantity).HasColumnName("GuestQuantity").HasColumnType("INT");
            builder.Property(x => x.ClassRoomLink).HasColumnName("ClassRoomLink").HasColumnType("VARCHAR").HasMaxLength(800);
            builder.Property(x => x.Capacity).HasColumnName("Capacity").HasColumnType("INT");
            builder.Property(x => x.FirstAdminInput).HasColumnName("FirstAdminInput").HasColumnType("BIT");
            builder.Property(x => x.TeacherEntersFirst).HasColumnName("TeacherEntersFirst").HasColumnType("BIT");
            builder.Property(x => x.MaxSessionTime).HasColumnName("MaxSessionTime").HasColumnType("INT");
            builder.Property(x => x.Status).HasColumnName("Status").HasColumnType("TINYINT");
            builder.Property(x => x.Title).HasColumnName("Title").HasMaxLength(150);
            builder.Property(x => x.UserId).HasColumnName("UserId");
            builder.HasOne(x => x.User).WithMany(x => x.Rooms).HasForeignKey(x => x.UserId).HasConstraintName("FK_Rooms_Users_UserId");
            builder.HasMany(x => x.RoomUsers).WithOne(x => x.Room).HasForeignKey(x => x.RoomId).HasConstraintName("FK_RoomUsers_Rooms_RoomId");
            builder.HasMany(x => x.Messages).WithOne(x => x.Room).HasForeignKey(x => x.RoomId);
        }
    }
}
