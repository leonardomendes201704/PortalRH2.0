using System.Text.Json;
using System.Text.Json.Nodes;

namespace PortalRH.Api.Domain;

internal static class ShellPanelJson
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static JsonNode LabelBadge(string label, string badge) =>
        Serialize(new { label, badge });

    public static JsonNode LabelValue(string label, string value) =>
        Serialize(new { label, value });

    public static JsonNode LabelOnly(string label, string? url = null) =>
        url is null ? Serialize(new { label }) : Serialize(new { label, url });

    public static JsonNode LabelLink(string label, string url, string? badge = null) =>
        badge is null ? Serialize(new { label, url }) : Serialize(new { label, url, badge });

    public static JsonNode QuickLink(string className, string label, string shortLabel, string url) =>
        Serialize(new { className, label, shortLabel, url });

    public static JsonNode HrLink(string label, string url, string provider) =>
        Serialize(new { label, url, provider });

    private static JsonNode Serialize(object value) =>
        JsonSerializer.SerializeToNode(value, JsonOptions)!;
}
