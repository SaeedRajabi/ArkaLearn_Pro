using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.DashboardConfigure;

public class SupportTicketQueryConfiguration : IEntityTypeConfiguration<SupportTicketQueryModel>
{
    public void Configure(EntityTypeBuilder<SupportTicketQueryModel> builder)
    {
        builder.ToTable("SupportTickets");
        builder.HasKey(x => x.Id);
    }
}
