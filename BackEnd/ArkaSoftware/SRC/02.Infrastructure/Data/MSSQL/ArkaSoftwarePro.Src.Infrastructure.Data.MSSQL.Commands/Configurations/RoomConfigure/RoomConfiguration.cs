using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.RoomConfigure
{
    public class RoomConfiguration : IEntityTypeConfiguration<Room>
    {
        public void Configure(EntityTypeBuilder<Room> builder)
        {
            builder.ToTable("Rooms", "Room");
            builder.Property(x => x.Title).HasMaxLength(150).HasConversion(x => x!.Value, x => RoomTitle.Create(x)).IsRequired();
            builder.Property(x => x.Slug).HasMaxLength(120).HasColumnType("VARCHAR");
            builder.Property(x => x.ClassRoomLink).HasMaxLength(800).HasColumnType("VARCHAR").HasConversion(x => x!.Link, x => new RoomLink(x)).IsRequired();
            builder.Property(x => x.RoomCode).HasMaxLength(8).HasColumnType("VARCHAR");
            builder.Property(x => x.DefaultMediaFileId).HasColumnType("BIGINT");
            builder.Property(x => x.DefaultSlideFileId).HasColumnType("BIGINT");
            builder.HasOne(x => x.User).WithMany(x => x.Rooms).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.RoomUsers).WithOne(x => x.Room).HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.RoomFiles).WithOne(x => x.Room).HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => x.Title);
            builder.HasIndex(x => x.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");
        }
    }
}
