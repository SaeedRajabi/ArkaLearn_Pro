import { siteUrl } from '@/lib/seo';
import { BRAND_ICON_PATH } from '@/lib/seo/brand';

const aboutUrl = `${siteUrl}/about`;

const brandImage = `${siteUrl}${BRAND_ICON_PATH}`;



/** JSON-LD for Saeed Rajabi — surfaces client site for name / programmer searches */

export function JsonLdPerson() {

  const jsonLd = {

    '@context': 'https://schema.org',

    '@type': 'Person',

    '@id': `${aboutUrl}#saeed-rajabi`,

    name: 'Saeed Rajabi',

    alternateName: [

      'سعید رجبی',

      'SaeedRa',

      'سعید رجبی برنامه نویس',

      'برنامه نویس برتر',

      'top programmer',

    ],

    givenName: 'Saeed',

    familyName: 'Rajabi',

    jobTitle: 'Top Programmer',

    description:

      'Saeed Rajabi (سعید رجبی) — top programmer, software architect, and founder of Arka Norm Software / ArkaSoftware. Expert in .NET, React, Next.js, and online programming education in Persian and English.',

    url: aboutUrl,

    image: brandImage,

    worksFor: {

      '@type': 'Organization',

      '@id': `${siteUrl}/#organization`,

      name: 'ArkaSoftware | آرکا نرم افزار',

      alternateName: ['آرکا نرم افزار', 'Arka Norm Software'],

      url: siteUrl,

    },

    knowsAbout: [

      'Programming',

      'Software Development',

      'Web Development',

      'ASP.NET Core',

      'C#',

      'React',

      'Next.js',

      'Programming Education',

      'Clean Architecture',

      'برنامه نویسی',

    ],

    mainEntityOfPage: {

      '@type': 'WebPage',

      '@id': aboutUrl,

    },

  };



  return (

    <script

      type="application/ld+json"

      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}

    />

  );

}

