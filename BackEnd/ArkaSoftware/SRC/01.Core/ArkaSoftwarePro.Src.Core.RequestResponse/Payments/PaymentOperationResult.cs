namespace ArkaSoftwarePro.Src.Core.RequestResponse.Payments;

public enum PaymentOutcome
{
    Success,
    ValidationError,
    Unauthorized,
    Forbidden,
    NotFound,
    GatewayUnavailable,
    GatewayFailure,
    Redirect,
    Text,
}

public sealed record PaymentOperationResult(PaymentOutcome Kind, object? Data = null, string? Url = null);
