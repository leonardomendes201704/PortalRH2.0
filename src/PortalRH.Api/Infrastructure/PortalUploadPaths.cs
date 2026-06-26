namespace PortalRH.Api.Infrastructure;

public static class PortalUploadPaths
{
    public const string FeedFolderName = "feed";

    public static string ResolveUploadsRoot(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configured = configuration["FileStorage:UploadsRoot"]?.Trim();
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return Path.GetFullPath(configured);
        }

        var webRootPath = environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(environment.ContentRootPath, "wwwroot");
        }

        return Path.Combine(webRootPath, "uploads");
    }

    public static string BuildFeedPublicUrl(string fileName)
    {
        return $"/uploads/{FeedFolderName}/{fileName}";
    }
}
