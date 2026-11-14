using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.UsersConfigure
{
    public class FavoriteSeminarConfiguration : IEntityTypeConfiguration<FavoriteSeminarQueryModel>
    {
        public void Configure(EntityTypeBuilder<FavoriteSeminarQueryModel> builder)
        {
            builder.ToTable("FavoriteSeminars", "User");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnType("BIGINT");
            builder.Property(x => x.SeminarId).HasColumnType("BIGINT");
            builder.Property(x => x.CreatedAt).HasColumnType("DATETIME2");

            builder.HasIndex(x => new { x.UserId, x.SeminarId }).IsUnique();
            builder.HasOne(x => x.Seminar)
                .WithMany()
                .HasForeignKey(x => x.SeminarId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
