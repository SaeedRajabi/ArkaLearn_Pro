using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure
{
    public class CourseConfiguration : IEntityTypeConfiguration<Course>
    {
        public void Configure(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<Course> builder)
        {
            builder.ToTable("Courses", "Course");
            builder.Property(x => x.Title).HasMaxLength(100).HasConversion(x => x!.Value, x => new Title(x));
            builder.Property(x => x.Price).HasConversion(x => x!.Amount, x => new Price(x));
            builder.Property(x => x.OriginalPrice).HasConversion(
                x => x == null ? (decimal?)null : x.Amount,
                x => x == null ? null : new Price(x.Value));

            builder.OwnsOne(x => x.AverageRating, averageRate =>
            {
                averageRate.Property(av => av.Value).HasColumnName("AverageRateValue").HasColumnType("FLOAT").IsRequired();
                averageRate.Property(av => av.NumberOfRatings).HasColumnName("NumberOfRatings").HasColumnType("SMALLINT").IsRequired();
            });

            builder.Property(x => x.TitleImage).HasMaxLength(500).HasColumnType("NVARCHAR");
            builder.Property(x => x.Description).HasMaxLength(int.MaxValue);
            builder.Property(x => x.LongDescription).HasMaxLength(int.MaxValue).HasConversion(x => x!.Value, x => new LongDescription(x!));
            builder.Property(x => x.DeliveryMode).HasDefaultValue(CourseDeliveryMode.DirectDownload);
            builder.Property(x => x.SpotPlayerCourseKey).HasMaxLength(100);
            builder.Property(x => x.LifecyclePhase).HasDefaultValue(CourseLifecyclePhase.NotStarted);
            builder.Property(x => x.RegistrationDeadlineUtc);
            builder.Property(x => x.CourseStartUtc);
            builder.Property(x => x.CourseEndUtc);
            builder.Property(x => x.IsRegistrationClosed).HasDefaultValue(false);
            builder.Property(x => x.SeoTitle).HasMaxLength(200);
            builder.Property(x => x.MetaDescription).HasMaxLength(320);
            builder.Property(x => x.OgImageUrl).HasMaxLength(500);
            builder.Property(x => x.CourseLanguage).HasMaxLength(8).HasDefaultValue("fa");
            builder.Property(x => x.ModerationRejectionNote).HasMaxLength(2000);
            builder.Property(x => x.PaymentType).HasDefaultValue(CoursePaymentType.Cash);

            builder.HasMany(x => x.CourseSessions).WithOne(x => x.Course).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.CourseComments).WithOne().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.InstallmentPlans)
                .WithOne(x => x.Course)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Navigation(x => x.InstallmentPlans)
                .HasField("_installmentPlans")
                .UsePropertyAccessMode(PropertyAccessMode.Field);
            builder.HasOne(x => x.Teacher).WithMany(x => x.Courses).HasForeignKey(x => x.TeacherId).OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(x => x.Title);
            builder.HasIndex(x => x.Price);
        }
    }
}
