using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure
{
    public class CourseFaqConfiguration:IEntityTypeConfiguration<CourseFaq>
    {
        public void Configure(EntityTypeBuilder<CourseFaq> builder)
        {
            builder.ToTable("FAQs", "Course");

            builder.Property(x => x.Question)
                .HasColumnType("NVARCHAR").HasMaxLength(4000)
                .HasConversion(x => x!.Content, x => Question.Create(x!));

            builder.Property(x => x.Answer)
                .HasColumnType("NVARCHAR").HasMaxLength(4000)
                .HasConversion(x => x!.Content, x => Answer.Create(x!));

            builder.HasOne<Course>().WithMany(x => x.CourseFaqs)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
