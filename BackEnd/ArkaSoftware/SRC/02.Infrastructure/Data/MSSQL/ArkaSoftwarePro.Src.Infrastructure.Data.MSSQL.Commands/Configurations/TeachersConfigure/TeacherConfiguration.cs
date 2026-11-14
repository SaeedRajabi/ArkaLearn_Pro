using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs;
using Framework.Src.Core.Domain.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.TeachersConfigure
{
    public class TeacherConfiguration : IEntityTypeConfiguration<Teacher>
    {
        public void Configure(EntityTypeBuilder<Teacher> builder)
        {
            builder.ToTable("Teachers", "Teacher");

            builder.Property(x => x.LongDescription)
                .HasConversion(x => x!.Value , x => new LongDescription(x!))
                .HasColumnType("NVARCHAR").HasMaxLength(4000);

            builder.Property(x => x.ShortDescription).HasMaxLength(500);
            builder.Property(x => x.HeaderImageUrl).HasMaxLength(2000);
            builder.Property(x => x.PayoutSheba).HasMaxLength(26);
            builder.Property(x => x.PayoutCardNumber).HasMaxLength(16);
            builder.Property(x => x.ZarinPalBankAccountId).HasMaxLength(64);
            builder.Property(x => x.ZibalSubMerchantId).HasMaxLength(32);
            builder.Property(x => x.ProfileRejectionNote).HasMaxLength(2000);
            builder.Property(x => x.ExperiencePoints).HasDefaultValue(0);
            builder.Property(x => x.XpFreeMonthsRedeemed).HasDefaultValue(0);

            builder.HasOne(x => x.TeachingCategory)
                .WithMany()
                .HasForeignKey(x => x.TeachingCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(x => x.PromotionalVideos).WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(x => x.Books).WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(x => x.PortfolioArticles).WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(x => x.Courses).WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasMany(x => x.TeacherEducations).WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);


            builder.HasMany(x => x.TeacherExpertiseAreas).WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}
