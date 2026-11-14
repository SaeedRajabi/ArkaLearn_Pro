using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure
{
    public class CourseCommentConfiguration : IEntityTypeConfiguration<CourseComment>
    {
        public void Configure(EntityTypeBuilder<CourseComment> builder)
        {
            builder.ToTable("Comments", "Course");
            builder.Property(x => x.Content).HasMaxLength(100).HasConversion(x => x.Value, x => new CommentContent(x!)).IsRequired();
            builder.Property(x => x.Rating).HasColumnName("Rating").HasColumnType("INT");
            builder.Property(x => x.Like).HasColumnName("Like").HasColumnType("INT");
        }
    }

}
