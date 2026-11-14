namespace ArkaSoftwarePro.Src.Core.Contracts.Finance;

public sealed class TeacherPayoutTransferResult
{
    public bool Success { get; init; }
    public string? TransferReference { get; init; }
    public string? ZarinPalBankAccountId { get; init; }
    public string? ErrorMessage { get; init; }

    public static TeacherPayoutTransferResult Ok(string reference, string? bankAccountId = null) =>
        new() { Success = true, TransferReference = reference, ZarinPalBankAccountId = bankAccountId };

    public static TeacherPayoutTransferResult Fail(string message) =>
        new() { Success = false, ErrorMessage = message };
}

public interface ITeacherPayoutTransferService
{
    Task<TeacherPayoutTransferResult> TransferToTeacherAsync(
        string teacherSheba,
        string? existingZarinPalBankAccountId,
        long amountToman,
        CancellationToken cancellationToken = default);
}
