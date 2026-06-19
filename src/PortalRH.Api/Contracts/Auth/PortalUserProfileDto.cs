namespace PortalRH.Api.Contracts.Auth;

public sealed record PortalUserProfileDto(
    Guid Id,
    string Login,
    string DisplayName,
    string? Email,
    string? Department,
    string? Title);
