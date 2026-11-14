namespace ArkaLearnDesktop.Application.Abstractions;

public interface IRemoteInputExecutor
{
    event Action<int, int>? CursorMoved;

    void SetTargetScreen(int boundsX, int boundsY, int width, int height);

    void ClearTargetScreen();

    void Apply(string payloadJson);
}
