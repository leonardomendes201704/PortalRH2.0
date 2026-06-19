using PortalRH.Api.Contracts.Admin.Auth;
using PortalRH.Api.Models;

namespace PortalRH.Api.Interfaces;

public interface IAdminAuthService
{
    Task<AdminLoginResponse?> LoginAsync(AdminLoginRequest request, CancellationToken cancellationToken);
    Task<AdminSessionDto?> GetActiveSessionAsync(string token, CancellationToken cancellationToken);
    Task<bool> LogoutAsync(string token, CancellationToken cancellationToken);
    Task<bool> HasActiveSessionAsync(string token, CancellationToken cancellationToken);
    Task EnsureDefaultSuperAdminAsync(CancellationToken cancellationToken);
}
