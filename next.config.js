module.exports = {
  async rewrites() {
    return [
      {
        source: '/:page((?!_next|assets|en|ja|legacy|dashboard|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
        destination: '/legacy/:page',
      },
    ];
  },
};
