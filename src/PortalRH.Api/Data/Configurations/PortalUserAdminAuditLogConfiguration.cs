using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalRH.Api.Models;

namespace PortalRH.Api.Data.Configurations;

public class PortalUserAdminAuditLogConfiguration : IEntityTypeConfiguration<PortalUserAdminAuditLog>
{
    public void Configure(EntityTypeBuilder<PortalUserAdminAuditLog> builder)
    {
        builder.ToTable("portal_user_admin_audit_logs");

        builder.HasKey(item => item.Id);

        builder.Property(item => item.ActionType)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(item => item.ActorUsername)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(item => item.ActorDisplayName)
            .HasMaxLength(160)
            .IsRequired();

        builder.Property(item => item.ActorRole)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(item => item.PreviousValue)
            .HasMaxLength(240);

        builder.Property(item => item.NewValue)
            .HasMaxLength(240);

        builder.Property(item => item.Notes)
            .HasMaxLength(500);

        builder.Property(item => item.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(item => item.PortalUserId);
        builder.HasIndex(item => item.CreatedAtUtc);

        builder.HasOne(item => item.PortalUser)
            .WithMany(item => item.AuditLogs)
            .HasForeignKey(item => item.PortalUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(item => item.AdminUser)
            .WithMany()
            .HasForeignKey(item => item.AdminUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
