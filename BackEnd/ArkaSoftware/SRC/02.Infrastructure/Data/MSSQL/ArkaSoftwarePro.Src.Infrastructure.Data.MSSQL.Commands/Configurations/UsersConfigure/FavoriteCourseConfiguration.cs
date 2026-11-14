using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class FavoriteCourseConfiguration : IEntityTypeConfiguration<FavoriteCourse>
    {
        public void Configure(EntityTypeBuilder<FavoriteCourse> builder)
        {
            builder.ToTable("FavoriteCourses", "User");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnType("BIGINT").IsRequired();
            builder.Property(x => x.CourseId).HasColumnType("BIGINT").IsRequired();
            builder.Property(x => x.CreatedAt).HasColumnType("DATETIME2").IsRequired();

            builder.HasIndex(x => new { x.UserId, x.CourseId }).IsUnique();
            builder.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
