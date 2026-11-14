namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.ContactUs
{
    public class ContactUsPageQueryModel
    {
        public long Id { get; set; }
        public string PageTitle { get; set; } = string.Empty;
        public string PageSubtitle { get; set; } = string.Empty;
        public string HeroTitle { get; set; } = string.Empty;
        public string HeroSubtitle { get; set; } = string.Empty;
        public string HeadquartersTitle { get; set; } = string.Empty;
        public string HeadquartersAddress { get; set; } = string.Empty;
        public string HeadquartersPhone { get; set; } = string.Empty;
        public string HeadquartersEmail { get; set; } = string.Empty;
        public string ContactInfoTitle { get; set; } = string.Empty;
        public string ContactInfoPhone { get; set; } = string.Empty;
        public string ContactInfoEmail { get; set; } = string.Empty;
        public string SalesSupportTitle { get; set; } = string.Empty;
        public string SalesSupportPhone { get; set; } = string.Empty;
        public string SalesSupportEmail { get; set; } = string.Empty;
        public string FormTitle { get; set; } = string.Empty;
        public string FormDescription { get; set; } = string.Empty;
        public string MapEmbedUrl { get; set; } = string.Empty;
        public string FacebookUrl { get; set; } = string.Empty;
        public string TwitterUrl { get; set; } = string.Empty;
        public string InstagramUrl { get; set; } = string.Empty;
        public string LinkedInUrl { get; set; } = string.Empty;
        public DateTime? CreatedDateTime { get; set; }
        public DateTime? ModifiedDateTime { get; set; }
    }
}
