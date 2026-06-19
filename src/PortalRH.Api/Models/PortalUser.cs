namespace PortalRH.Api.Models;

public class PortalUser
{
    public Guid Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public string? SamAccountName { get; set; }
    public string? UserPrincipalName { get; set; }
    public string? Email { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Title { get; set; }
    public string? DistinguishedName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }

    public ICollection<PortalSession> Sessions { get; set; } = new List<PortalSession>();
}
