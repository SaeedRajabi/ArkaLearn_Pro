using Framework.Src.Utilities.OutService.Extensions;
using Microsoft.AspNetCore.Http;
using SkiaSharp;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class ImageDimensionValidationTests
{
    [Theory]
    [InlineData(1, 1, true)]
    [InlineData(600, 600, true)]
    [InlineData(601, 1, false)]
    [InlineData(1, 601, false)]
    public void PngDimensionsRespectBothLimits(int width, int height, bool expected)
    {
        using var bitmap = new SKBitmap(width, height);
        bitmap.Erase(SKColors.Blue);
        using var encoded = bitmap.Encode(SKEncodedImageFormat.Png, 100);
        using var stream = new MemoryStream(encoded.ToArray());
        Assert.Equal(expected, File(stream).HaveValidDimensionsExtension());
    }

    [Theory]
    [InlineData(SKEncodedImageFormat.Jpeg)]
    [InlineData(SKEncodedImageFormat.Webp)]
    public void OtherSupportedFormatsStillValidate(SKEncodedImageFormat format)
    {
        using var bitmap = new SKBitmap(20, 30);
        bitmap.Erase(SKColors.Red);
        using var encoded = bitmap.Encode(format, 90);
        using var stream = new MemoryStream(encoded.ToArray());
        Assert.True(File(stream).HaveValidDimensionsExtension());
    }

    [Fact]
    public void GifStillValidates()
    {
        using var stream = new MemoryStream(Convert.FromBase64String("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"));
        Assert.True(File(stream).HaveValidDimensionsExtension());
    }

    [Theory]
    [InlineData("")]
    [InlineData("This is not an image")]
    public void EmptyAndNonImageDataAreRejected(string input)
    {
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(input));
        Assert.False(File(stream).HaveValidDimensionsExtension());
    }

    [Fact]
    public void TruncatedPixelDataIsRejectedEvenWhenDimensionsCanBeRead()
    {
        using var bitmap = new SKBitmap(30, 30);
        bitmap.Erase(SKColors.Green);
        using var encoded = bitmap.Encode(SKEncodedImageFormat.Png, 100);
        var bytes = encoded.ToArray();
        // Keep the PNG signature, IHDR and the start of IDAT, but remove most compressed pixels.
        using var stream = new MemoryStream(bytes[..50]);
        Assert.False(File(stream).HaveValidDimensionsExtension());
    }

    [Fact]
    public void NullUploadIsRejected() => Assert.False(((IFormFile)null!).HaveValidDimensionsExtension());

    private static IFormFile File(Stream stream) => new FormFile(stream, 0, stream.Length, "image", "upload.png");
}
