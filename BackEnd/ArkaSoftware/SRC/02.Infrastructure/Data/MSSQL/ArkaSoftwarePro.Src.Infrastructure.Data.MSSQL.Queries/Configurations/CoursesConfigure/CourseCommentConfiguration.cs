using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure
{
    public class CourseCommentConfiguration:IEntityTypeConfiguration<CourseCommentQueryModel>
    {
        public void Configure(EntityTypeBuilder<CourseCommentQueryModel> builder)
        {
            builder.ToTable("Comments", "Course");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.CommentText)
             .HasColumnName("Content")
             .HasColumnType("NVARCHAR")
             .HasMaxLength(100);

            builder.Property(x => x.Likes)
                .HasColumnName("Like")
                .HasColumnType("INT");

            builder.Property(x => x.CreateAt)
                .HasColumnName("CreatedDateTime")
                .HasColumnType("DATETIME2")
                .HasMaxLength(7);
        }
    }
}
