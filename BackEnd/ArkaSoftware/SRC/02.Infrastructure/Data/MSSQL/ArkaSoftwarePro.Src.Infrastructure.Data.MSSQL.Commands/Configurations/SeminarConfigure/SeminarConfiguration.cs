using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.SeminarConfigure
{
    public class SeminarConfiguration : IEntityTypeConfiguration<Seminar>
    {
        public void Configure(EntityTypeBuilder<Seminar> builder)
        {
            builder.ToTable("Seminars", "Seminar");
            builder.Property(x => x.Title).HasMaxLength(200).HasConversion(x => x!.Value, x => new SeminarTitle(x)).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(int.MaxValue).HasConversion(x => x!.Value, x => new SeminarDescription(x));
            builder.Property(x => x.StartTime).IsRequired();
            builder.Property(x => x.EndTime).IsRequired();
            builder.Property(x => x.Capacity).IsRequired();
            builder.Property(x => x.Price).HasConversion(x => x!.Amount, x => new Price(x));
            builder.Property(x => x.IsFree).IsRequired();
            builder.Property(x => x.Status).IsRequired();
            builder.Property(x => x.EntryLink).HasMaxLength(800).HasConversion(x => x!.Value, x => new SeminarEntryLink(x));
            builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
            builder.Property(x => x.VideoUrl).HasMaxLength(500);
            builder.Property(x => x.RecordingVideoUrl).HasMaxLength(500);
            builder.Property(x => x.IsPublic).HasDefaultValue(true);
            builder.Property(x => x.Prerequisites).HasMaxLength(4000);
            builder.Property(x => x.FaqsJson).HasMaxLength(4000);
            builder.Property(x => x.SeoTitle).HasMaxLength(200);
            builder.Property(x => x.MetaDescription).HasMaxLength(320);
            builder.Property(x => x.OgImageUrl).HasMaxLength(500);
            builder.HasOne(x => x.Room).WithMany().HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.SetNull);
            builder.HasMany(x => x.Tags).WithOne().HasForeignKey("SeminarId").OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.Registrations).WithOne(x => x.Seminar).HasForeignKey(x => x.SeminarId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.SeminarComments).WithOne().HasForeignKey(x => x.SeminarId).OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(x => x.StartTime);
            builder.HasIndex(x => x.Status);
        }
    }
}
