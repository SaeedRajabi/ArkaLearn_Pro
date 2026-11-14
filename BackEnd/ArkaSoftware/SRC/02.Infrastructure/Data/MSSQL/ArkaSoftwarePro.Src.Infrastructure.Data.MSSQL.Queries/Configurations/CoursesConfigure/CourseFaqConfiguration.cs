using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure;

public class CourseFaqConfiguration : IEntityTypeConfiguration<CourseFaqQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseFaqQueryModel> builder)
    {
        builder.ToTable("FAQs", "Course").HasKey(x => x.Id).HasName("Id");
        builder.Property(x => x.Question)
            .HasColumnName("Question")
            .HasColumnType("NVARCHAR").HasMaxLength(4000);

        builder.Property(x => x.Answer)
            .HasColumnName("Answer")
            .HasColumnType("NVARCHAR").HasMaxLength(4000);

        builder.Property(x => x.CourseQueryModelId)
             .HasColumnName("CourseId")
             .HasColumnType("BIGINT");

        builder.HasOne(x => x.CourseQueryModel)
            .WithMany(x => x.CourseFaqs)
            .HasForeignKey(x => x.CourseQueryModelId)
            .HasConstraintName("FK_FAQs_Courses_CourseId")
            .OnDelete(DeleteBehavior.Cascade);

    }
}