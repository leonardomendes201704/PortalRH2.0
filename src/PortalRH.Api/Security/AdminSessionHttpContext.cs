using PortalRH.Api.Contracts.Admin.Auth;

namespace PortalRH.Api.Security;

public static class AdminSessionHttpContext
{
    public const string SessionItemKey = "PortalRH.AdminSession";

    public static void Store(HttpContext context, AdminSessionDto session)
    {
        context.Items[SessionItemKey] = session;
    }

    public static AdminSessionDto? Get(HttpContext context)
    {
        return context.Items.TryGetValue(SessionItemKey, out var value)
            ? value as AdminSessionDto
            : null;
    }
}
