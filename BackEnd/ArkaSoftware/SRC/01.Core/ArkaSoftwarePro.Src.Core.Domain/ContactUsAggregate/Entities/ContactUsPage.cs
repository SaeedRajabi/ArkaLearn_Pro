using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.ContactUsAggregate.Entities
{
    public class ContactUsPage : AggregateRoot
    {
        public string PageTitle { get; private set; } = string.Empty;
        public string PageSubtitle { get; private set; } = string.Empty;
        public string HeroTitle { get; private set; } = string.Empty;
        public string HeroSubtitle { get; private set; } = string.Empty;
        public string HeadquartersTitle { get; private set; } = string.Empty;
        public string HeadquartersAddress { get; private set; } = string.Empty;
        public string HeadquartersPhone { get; private set; } = string.Empty;
        public string HeadquartersEmail { get; private set; } = string.Empty;
        public string ContactInfoTitle { get; private set; } = string.Empty;
        public string ContactInfoPhone { get; private set; } = string.Empty;
        public string ContactInfoEmail { get; private set; } = string.Empty;
        public string SalesSupportTitle { get; private set; } = string.Empty;
        public string SalesSupportPhone { get; private set; } = string.Empty;
        public string SalesSupportEmail { get; private set; } = string.Empty;
        public string FormTitle { get; private set; } = string.Empty;
        public string FormDescription { get; private set; } = string.Empty;
        public string MapEmbedUrl { get; private set; } = string.Empty;
        public string FacebookUrl { get; private set; } = string.Empty;
        public string TwitterUrl { get; private set; } = string.Empty;
        public string InstagramUrl { get; private set; } = string.Empty;
        public string LinkedInUrl { get; private set; } = string.Empty;

        private ContactUsPage()
        {
        }

        public ContactUsPage(
            string pageTitle,
            string pageSubtitle,
            string heroTitle,
            string heroSubtitle,
            string headquartersTitle,
            string headquartersAddress,
            string headquartersPhone,
            string headquartersEmail,
            string contactInfoTitle,
            string contactInfoPhone,
            string contactInfoEmail,
            string salesSupportTitle,
            string salesSupportPhone,
            string salesSupportEmail,
            string formTitle,
            string formDescription,
            string mapEmbedUrl,
            string facebookUrl,
            string twitterUrl,
            string instagramUrl,
            string linkedInUrl)
        {
            Update(
                pageTitle,
                pageSubtitle,
                heroTitle,
                heroSubtitle,
                headquartersTitle,
                headquartersAddress,
                headquartersPhone,
                headquartersEmail,
                contactInfoTitle,
                contactInfoPhone,
                contactInfoEmail,
                salesSupportTitle,
                salesSupportPhone,
                salesSupportEmail,
                formTitle,
                formDescription,
                mapEmbedUrl,
                facebookUrl,
                twitterUrl,
                instagramUrl,
                linkedInUrl);
        }

        public void Update(
            string pageTitle,
            string pageSubtitle,
            string heroTitle,
            string heroSubtitle,
            string headquartersTitle,
            string headquartersAddress,
            string headquartersPhone,
            string headquartersEmail,
            string contactInfoTitle,
            string contactInfoPhone,
            string contactInfoEmail,
            string salesSupportTitle,
            string salesSupportPhone,
            string salesSupportEmail,
            string formTitle,
            string formDescription,
            string mapEmbedUrl,
            string facebookUrl,
            string twitterUrl,
            string instagramUrl,
            string linkedInUrl)
        {
            PageTitle = pageTitle?.Trim() ?? string.Empty;
            PageSubtitle = pageSubtitle?.Trim() ?? string.Empty;
            HeroTitle = heroTitle?.Trim() ?? string.Empty;
            HeroSubtitle = heroSubtitle?.Trim() ?? string.Empty;
            HeadquartersTitle = headquartersTitle?.Trim() ?? string.Empty;
            HeadquartersAddress = headquartersAddress?.Trim() ?? string.Empty;
            HeadquartersPhone = headquartersPhone?.Trim() ?? string.Empty;
            HeadquartersEmail = headquartersEmail?.Trim() ?? string.Empty;
            ContactInfoTitle = contactInfoTitle?.Trim() ?? string.Empty;
            ContactInfoPhone = contactInfoPhone?.Trim() ?? string.Empty;
            ContactInfoEmail = contactInfoEmail?.Trim() ?? string.Empty;
            SalesSupportTitle = salesSupportTitle?.Trim() ?? string.Empty;
            SalesSupportPhone = salesSupportPhone?.Trim() ?? string.Empty;
            SalesSupportEmail = salesSupportEmail?.Trim() ?? string.Empty;
            FormTitle = formTitle?.Trim() ?? string.Empty;
            FormDescription = formDescription?.Trim() ?? string.Empty;
            MapEmbedUrl = mapEmbedUrl?.Trim() ?? string.Empty;
            FacebookUrl = facebookUrl?.Trim() ?? string.Empty;
            TwitterUrl = twitterUrl?.Trim() ?? string.Empty;
            InstagramUrl = instagramUrl?.Trim() ?? string.Empty;
            LinkedInUrl = linkedInUrl?.Trim() ?? string.Empty;
        }
    }
}
