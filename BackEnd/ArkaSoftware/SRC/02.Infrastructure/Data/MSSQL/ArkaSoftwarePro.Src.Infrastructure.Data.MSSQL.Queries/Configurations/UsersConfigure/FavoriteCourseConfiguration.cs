using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.UsersConfigure
{
    public class FavoriteCourseConfiguration : IEntityTypeConfiguration<FavoriteCourseQueryModel>
    {
        public void Configure(EntityTypeBuilder<FavoriteCourseQueryModel> builder)
        {
            builder.ToTable("FavoriteCourses", "User");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnType("BIGINT");
            builder.Property(x => x.CourseId).HasColumnType("BIGINT");
            builder.Property(x => x.CreatedAt).HasColumnType("DATETIME2");

            builder.HasIndex(x => new { x.UserId, x.CourseId }).IsUnique();
            builder.HasOne(x => x.Course)
                .WithMany()
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
