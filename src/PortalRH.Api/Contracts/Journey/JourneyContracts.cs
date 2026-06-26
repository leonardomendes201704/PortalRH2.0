namespace PortalRH.Api.Contracts.Journey;

public sealed record JourneyItemDto(
    string Label,
    string Badge,
    string Source);

public sealed record JourneySummaryResponse(
    IReadOnlyList<JourneyItemDto> Items,
    string Provider,
    bool IsSimulated);
