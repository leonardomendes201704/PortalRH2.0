using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using PortalRH.Api.Contracts.Auth;
using PortalRH.Api.Data;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Models;

namespace PortalRH.Api.Services;

public class PortalAuthService : IPortalAuthService
{
    private static readonly TimeSpan SessionDuration = TimeSpan.FromHours(8);

    private readonly PortalRhDbContext _dbContext;
    private readonly ILdapConfigurationService _ldapConfigurationService;
    private readonly ILdapDirectoryAuthenticator _ldapDirectoryAuthenticator;

    public PortalAuthService(
        PortalRhDbContext dbContext,
        ILdapConfigurationService ldapConfigurationService,
        ILdapDirectoryAuthenticator ldapDirectoryAuthenticator)
    {
        _dbContext = dbContext;
        _ldapConfigurationService = ldapConfigurationService;
        _ldapDirectoryAuthenticator = ldapDirectoryAuthenticator;
    }

    public async Task<PortalLoginResponse?> LoginWithLdapAsync(LdapLoginRequest request, CancellationToken cancellationToken)
    {
        var login = Normalize(request.Login);
        if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var ldapConfiguration = await _ldapConfigurationService.GetRuntimeConfigurationAsync(cancellationToken);
        if (!ldapConfiguration.IsEnabled || string.IsNullOrWhiteSpace(ldapConfiguration.Server))
        {
            return null;
        }

        var authenticatedUser = await _ldapDirectoryAuthenticator.AuthenticateAsync(
            ldapConfiguration,
            login,
            request.Password,
            cancellationToken);

        if (authenticatedUser is null)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var portalUser = await _dbContext.PortalUsers
            .FirstOrDefaultAsync(item => item.Login == authenticatedUser.Login, cancellationToken);

        if (portalUser is null)
        {
            portalUser = new PortalUser
            {
                Id = Guid.NewGuid(),
                Login = authenticatedUser.Login,
                CreatedAtUtc = now,
                IsActive = true
            };

            _dbContext.PortalUsers.Add(portalUser);
        }

        portalUser.SamAccountName = authenticatedUser.SamAccountName;
        portalUser.UserPrincipalName = authenticatedUser.UserPrincipalName;
        portalUser.Email = authenticatedUser.Email;
        portalUser.DisplayName = authenticatedUser.DisplayName;
        portalUser.Department = authenticatedUser.Department;
        portalUser.Title = authenticatedUser.Title;
        portalUser.DistinguishedName = authenticatedUser.DistinguishedName;
        portalUser.IsActive = true;
        portalUser.LastLoginAtUtc = now;
        portalUser.UpdatedAtUtc = now;

        var session = new PortalSession
        {
            Id = Guid.NewGuid(),
            PortalUserId = portalUser.Id,
            Token = GenerateToken(),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(SessionDuration)
        };

        _dbContext.PortalSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new PortalLoginResponse(
            session.Token,
            session.ExpiresAtUtc,
            new PortalUserProfileDto(
                portalUser.Id,
                portalUser.Login,
                portalUser.DisplayName,
                portalUser.Email,
                portalUser.Department,
                portalUser.Title));
    }

    private static string Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    private static string GenerateToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
            .Replace("+", "-", StringComparison.Ordinal)
            .Replace("/", "_", StringComparison.Ordinal);
    }
}
