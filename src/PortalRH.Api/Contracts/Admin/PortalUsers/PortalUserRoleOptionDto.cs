namespace PortalRH.Api.Contracts.Admin.PortalUsers;

public sealed record PortalUserRoleOptionDto(
    string Key,
    string Label,
    IReadOnlyList<string> Permissions);
