using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;

/// <summary>
/// Catalog student for online rooms: admin-defined credentials and profile, assignable to one or more rooms as <see cref="RoomUser"/>.
/// </summary>
public class ManagedRoomStudent : AggregateRoot
{
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public UserName UserName { get; private set; } = null!;
    public string? Email { get; private set; }
    public Password Password { get; private set; } = null!;
    public string? Phone { get; private set; }
    public string? Notes { get; private set; }
    public string? Gender { get; private set; }
    public DateTime? DateOfBirth { get; private set; }
    public string? PhotoUrl { get; private set; }

    private ManagedRoomStudent()
    {
    }

    public static ManagedRoomStudent Create(
        string firstName,
        string lastName,
        string userName,
        string? email,
        string plainPassword,
        string? phone,
        string? notes,
        string? gender,
        DateTime? dateOfBirth,
        string? photoUrl)
    {
        return new ManagedRoomStudent
        {
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            UserName = new UserName(userName.Trim()),
            Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
            Password = Password.Create(plainPassword),
            Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim(),
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
            Gender = string.IsNullOrWhiteSpace(gender) ? null : gender.Trim(),
            DateOfBirth = dateOfBirth,
            PhotoUrl = string.IsNullOrWhiteSpace(photoUrl) ? null : photoUrl.Trim(),
        };
    }

    public void Update(
        string? firstName,
        string? lastName,
        string? userName,
        string? email,
        string? plainPassword,
        string? phone,
        string? notes,
        string? gender,
        DateTime? dateOfBirth,
        string? photoUrl)
    {
        if (!string.IsNullOrWhiteSpace(firstName))
            FirstName = firstName.Trim();
        if (!string.IsNullOrWhiteSpace(lastName))
            LastName = lastName.Trim();
        if (!string.IsNullOrWhiteSpace(userName))
            UserName = new UserName(userName.Trim());
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
        if (!string.IsNullOrWhiteSpace(plainPassword))
            Password = Password.Create(plainPassword);
        Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
        Gender = string.IsNullOrWhiteSpace(gender) ? null : gender.Trim();
        if (dateOfBirth.HasValue)
            DateOfBirth = dateOfBirth;
        if (photoUrl != null)
            PhotoUrl = string.IsNullOrWhiteSpace(photoUrl) ? null : photoUrl.Trim();
    }

    public void MarkAsDeleted()
    {
        IsDelete = true;
    }
}
