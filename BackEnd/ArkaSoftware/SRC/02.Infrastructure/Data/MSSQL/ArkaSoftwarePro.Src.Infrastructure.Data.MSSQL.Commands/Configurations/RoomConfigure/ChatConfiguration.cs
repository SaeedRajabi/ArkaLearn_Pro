using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.RoomConfigure
{
    public class ChatConfiguration : IEntityTypeConfiguration<Chat>
    {
        public void Configure(EntityTypeBuilder<Chat> builder)
        {
            builder.ToTable("Chats", "Room");

            builder.HasIndex(x => x.Message);


            builder.HasOne(x => x.Room).WithMany(x=> x.Chats).HasForeignKey(x=>x.RoomId).HasConstraintName("Fk_Chats_Rooms_RoomId");
        }
    }
}
