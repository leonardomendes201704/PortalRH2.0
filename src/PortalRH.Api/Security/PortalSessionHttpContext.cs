using PortalRH.Api.Models;

namespace PortalRH.Api.Security;

public static class PortalSessionHttpContext
{
    public const string SessionItemKey = "PortalRH.PortalSession";

    public static void Store(HttpContext context, PortalSession session)
    {
        context.Items[SessionItemKey] = session;
    }

    public static PortalSession? Get(HttpContext context)
    {
        return context.Items.TryGetValue(SessionItemKey, out var value)
            ? value as PortalSession
            : null;
    }
}
