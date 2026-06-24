using Microsoft.EntityFrameworkCore;
using PortalRH.Api.Models;

namespace PortalRH.Api.Data;

public class PortalRhDbContext : DbContext
{
    public PortalRhDbContext(DbContextOptions<PortalRhDbContext> options)
        : base(options)
    {
    }

    public DbSet<Communication> Communications => Set<Communication>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AdminSession> AdminSessions => Set<AdminSession>();
    public DbSet<LdapConfiguration> LdapConfigurations => Set<LdapConfiguration>();
    public DbSet<PortalUser> PortalUsers => Set<PortalUser>();
    public DbSet<PortalSession> PortalSessions => Set<PortalSession>();
    public DbSet<PortalUserLoginEvent> PortalUserLoginEvents => Set<PortalUserLoginEvent>();
    public DbSet<PortalUserAdminAuditLog> PortalUserAdminAuditLogs => Set<PortalUserAdminAuditLog>();
    public DbSet<Poll> Polls => Set<Poll>();
    public DbSet<PollOption> PollOptions => Set<PollOption>();
    public DbSet<PollVote> PollVotes => Set<PollVote>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PortalUserNotificationRead> PortalUserNotificationReads => Set<PortalUserNotificationRead>();
    public DbSet<AgendaEvent> AgendaEvents => Set<AgendaEvent>();
    public DbSet<MoodSurveyVote> MoodSurveyVotes => Set<MoodSurveyVote>();
    public DbSet<MoodSurveyAuditLog> MoodSurveyAuditLogs => Set<MoodSurveyAuditLog>();
    public DbSet<MoodSurveyFeedbackMessage> MoodSurveyFeedbackMessages => Set<MoodSurveyFeedbackMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PortalRhDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
