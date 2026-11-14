using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class FavoriteSeminarConfiguration : IEntityTypeConfiguration<FavoriteSeminar>
    {
        public void Configure(EntityTypeBuilder<FavoriteSeminar> builder)
        {
            builder.ToTable("FavoriteSeminars", "User");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnType("BIGINT").IsRequired();
            builder.Property(x => x.SeminarId).HasColumnType("BIGINT").IsRequired();
            builder.Property(x => x.CreatedAt).HasColumnType("DATETIME2").IsRequired();

            builder.HasIndex(x => new { x.UserId, x.SeminarId }).IsUnique();
            builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<Seminar>().WithMany().HasForeignKey(x => x.SeminarId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
