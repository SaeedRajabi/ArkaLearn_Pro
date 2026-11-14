using Newtonsoft.Json;

namespace ArkaSoftwarePro.Src.Endpoints.API.Common
{
    public class ParseStringConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(long) || objectType == typeof(long?);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            if (existingValue == null) throw new ArgumentNullException(nameof(existingValue));
            if (reader.TokenType == JsonToken.String)
            {
                if (long.TryParse((string)reader.Value!, out long result))
                    return result;
            }
            else if (reader.TokenType == JsonToken.Integer)
            {
                return Convert.ToInt64(reader.Value);
            }

            return 0L; // یا throw new JsonSerializationException("Invalid value");
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            writer.WriteValue(value!.ToString());
        }
    }
}
