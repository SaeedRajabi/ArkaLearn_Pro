using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArkaSoftwarePro.Src.Endpoints.API.Common;

/// <summary>
/// Serializes Int64 as JSON strings so JavaScript clients preserve snowflake IDs.
/// </summary>
public sealed class LongAsStringJsonConverter : JsonConverter<long>
{
    public override long Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var text = reader.GetString();
            return long.TryParse(text, out var value) ? value : 0L;
        }

        if (reader.TokenType == JsonTokenType.Number)
            return reader.GetInt64();

        throw new JsonException($"Unexpected token {reader.TokenType} when parsing long.");
    }

    public override void Write(Utf8JsonWriter writer, long value, JsonSerializerOptions options)
        => writer.WriteStringValue(value.ToString());
}

public sealed class NullableLongAsStringJsonConverter : JsonConverter<long?>
{
    public override long? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        if (reader.TokenType == JsonTokenType.String)
        {
            var text = reader.GetString();
            if (string.IsNullOrWhiteSpace(text))
                return null;
            return long.TryParse(text, out var value) ? value : null;
        }

        if (reader.TokenType == JsonTokenType.Number)
            return reader.GetInt64();

        throw new JsonException($"Unexpected token {reader.TokenType} when parsing long?.");
    }

    public override void Write(Utf8JsonWriter writer, long? value, JsonSerializerOptions options)
    {
        if (value == null)
            writer.WriteNullValue();
        else
            writer.WriteStringValue(value.Value.ToString());
    }
}
