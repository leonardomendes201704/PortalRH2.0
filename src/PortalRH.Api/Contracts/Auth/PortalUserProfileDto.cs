namespace PortalRH.Api.Contracts.Auth;

public sealed record PortalUserProfileDto(
    Guid Id,
    string Login,
    string DisplayName,
    string? Email,
    string? Department,
    string? Title,
    string? ManagerDisplayName,
    string Role,
    string RoleLabel,
    IReadOnlyList<string> Permissions,
    IReadOnlyList<PortalRH.Api.Contracts.Admin.PortalUsers.PortalUserModulePermissionDto> ModulePermissions);
