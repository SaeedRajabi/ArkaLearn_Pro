namespace Framework.Src.Core.RequestResponse.Common
{
    public enum ApplicationServiceStatus
    {
        Ok = 1,
        NotFound = 2,
        ValidationError = 3,
        InvalidDomainState = 4,
        Exception = 5,
        Exist = 6,
        Undocumented = 7,
    }
}
