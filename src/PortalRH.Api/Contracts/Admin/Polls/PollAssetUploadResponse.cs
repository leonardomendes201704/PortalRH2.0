namespace PortalRH.Api.Contracts.Admin.Polls;

public record PollAssetUploadResponse(
    string AssetType,
    string FileName,
    string ContentType,
    long Size,
    string Url);
