namespace PortalRH.Api.Domain;

public static class FeedPostAuditActionTypes
{
    public const string PostCreated = "PublicacaoRegistrada";
    public const string LikeRegistered = "CurtidaRegistrada";
    public const string LikeRemoved = "CurtidaRemovida";
}

public static class FeedItemSources
{
    public const string UserPost = "UserPost";
    public const string Communication = "Communication";
}
