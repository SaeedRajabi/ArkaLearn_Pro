// next-sitemap.config.js

const config = {
    siteUrl: 'https://arkasoftware.ir',
    generateRobotsTxt: false,
    exclude: [
        '/account',
        '/account/*',
        '/checkout',
        '/forgot-password',
        '/invoices/*',
        '/login',
        '/maintenance',
        '/offline',
        '/payments/*',
        '/register',
    ],
};

module.exports = config;