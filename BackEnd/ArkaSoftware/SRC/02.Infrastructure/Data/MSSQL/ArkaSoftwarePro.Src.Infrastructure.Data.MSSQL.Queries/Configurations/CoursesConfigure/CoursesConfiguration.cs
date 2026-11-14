using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure
{
    public class CoursesConfiguration : IEntityTypeConfiguration<CourseQueryModel>
    {
        public void Configure(EntityTypeBuilder<CourseQueryModel> builder)
        {
            builder.ToTable("Courses", "Course");
            builder.HasKey(x => x.CourseId).HasName("Id");
            builder.Property(x => x.CourseId).HasColumnName("Id");
            builder.Property(x => x.Title).HasColumnName("Title").HasColumnType("NVARCHAR").HasMaxLength(100);
            builder.Property(x => x.Price).HasColumnName("Price");
            builder.Property(x => x.OriginalPrice).HasColumnName("OriginalPrice");

            builder.Property(x => x.Description).HasColumnName("Description").HasMaxLength(4000);
            builder.Property(x => x.LongDescription).HasColumnName("LongDescription").HasMaxLength(4000);

            builder.Property(x => x.LogoImage)
                .HasColumnName("TitleImage")
                .HasColumnType("NVARCHAR")
                .HasMaxLength(500);

            builder.Property(x => x.AverageRateValue).HasColumnName("AverageRateValue");
            builder.Property(x => x.NumberOfRatings).HasColumnName("NumberOfRatings");
            builder.Property(x => x.CategoryId).HasColumnName("CategoryId");
            builder.Property(x => x.CourseLevel).HasColumnName("CourseLevel");
            builder.Property(x => x.CreateAt).HasColumnName("CreatedDateTime");
            builder.Property(x => x.CoursePlanId).HasColumnName("EducationPlanId");
        builder.Property(x => x.IsPublish).HasColumnName("IsPublish");
        builder.Property(x => x.ModerationStatus).HasColumnName("ModerationStatus");
        builder.Property(x => x.ModerationRejectionNote).HasColumnName("ModerationRejectionNote");
        builder.Property(x => x.IsCertificate).HasColumnName("IsCertificate");
        builder.Property(x => x.DeliveryMode).HasColumnName("DeliveryMode");
        builder.Property(x => x.SpotPlayerCourseKey).HasColumnName("SpotPlayerCourseKey").HasMaxLength(100);
        builder.Property(x => x.LifecyclePhase).HasColumnName("LifecyclePhase");
        builder.Property(x => x.RegistrationDeadlineUtc).HasColumnName("RegistrationDeadlineUtc");
        builder.Property(x => x.CourseStartUtc).HasColumnName("CourseStartUtc");
        builder.Property(x => x.CourseEndUtc).HasColumnName("CourseEndUtc");
        builder.Property(x => x.IsRegistrationClosed).HasColumnName("IsRegistrationClosed");
        builder.Property(x => x.CourseLanguage).HasColumnName("CourseLanguage").HasMaxLength(8);
        builder.Property(x => x.PaymentType).HasColumnName("PaymentType");


        builder.HasIndex(x => x.Title);
            builder.HasIndex(x => x.Price);

            builder.HasOne(x => x.Category)
                .WithMany(x => x.Courses)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Courses_Category_CategoryId");

            builder.HasOne(x => x.Teacher)
                .WithMany(x => x.Courses)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Courses_Teachers_TeacherId");


            builder.HasOne(x => x.CoursePlan)
                .WithMany(x => x.Courses)
                .HasForeignKey(x => x.CoursePlanId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Courses_EducationPlans_EducationPlanId");

            builder.HasMany(x => x.Comments)
                .WithOne(x => x.Course)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Comments_Courses_CourseId");

            builder.HasMany(x => x.Sections)
                .WithOne(x => x.Course)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_CourseSection_Courses_CourseId");

            builder.HasMany(x => x.Tags)
                .WithOne(x => x.Course)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Tags_Courses_CourseId");

            builder.HasMany(x => x.CourseFaqs)
                .WithOne(x => x.CourseQueryModel)
                .HasForeignKey(x => x.CourseQueryModelId)
                .OnDelete(DeleteBehavior.Cascade);
                //.HasConstraintName("FK_CourseFaqs_Courses_CourseId");

        }
    }
}
