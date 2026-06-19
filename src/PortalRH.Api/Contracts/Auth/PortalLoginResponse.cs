namespace PortalRH.Api.Contracts.Auth;

public sealed record PortalLoginResponse(
    string Token,
    DateTime ExpiresAtUtc,
    PortalUserProfileDto User);
