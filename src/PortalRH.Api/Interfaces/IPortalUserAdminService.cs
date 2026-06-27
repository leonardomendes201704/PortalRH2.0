using PortalRH.Api.Contracts.Admin.PortalUsers;
using PortalRH.Api.Contracts.Admin.Auth;

namespace PortalRH.Api.Interfaces;

public interface IPortalUserAdminService
{
    Task<PortalUserAdminListResponse> GetAllAsync(string? query, string? status, string? role, string? department, string? sortBy, string? sortDirection, int page, int pageSize, CancellationToken cancellationToken);
    Task<PortalUserAdminDto?> UpdateStatusAsync(Guid id, bool isActive, AdminProfileDto actor, CancellationToken cancellationToken);
    Task<PortalUserAdminDto?> UpdateRoleAsync(Guid id, string role, AdminProfileDto actor, CancellationToken cancellationToken);
    Task<PortalUserAdminDto?> UpdateModulePermissionAsync(Guid id, string moduleKey, string accessLevel, AdminProfileDto actor, CancellationToken cancellationToken);
}
