using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.RoomsConfigure
{
    public class MessageConfiguration:IEntityTypeConfiguration<MessageQueryModel>
    {
        public void Configure(EntityTypeBuilder<MessageQueryModel> builder)
        {
            builder.ToTable("Chats", "Room");
            builder.HasKey(x => x.MessageId).HasName("Id");
            builder.Property(x => x.MessageId).HasColumnName("Id");
            builder.Property(x => x.RoomId).HasColumnName("RoomId");
            builder.Property(x => x.SenderId).HasColumnName("CreatedByUserId").HasMaxLength(50);
            builder.Property(x => x.MessageText).HasColumnName("Message").HasMaxLength(450);
            builder.Property(x => x.SendAt).HasColumnName("CreatedDateTime").HasColumnType("DATETIME2").HasMaxLength(7);


            builder.HasOne(x => x.Room)
                .WithMany(x => x.Messages)
                .HasForeignKey(x => x.RoomId)
                .HasConstraintName("Fk_Chats_Rooms_RoomId");
        }
    }
}
