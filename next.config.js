module.exports = {
  async rewrites() {
    return [
      {
        source: '/:page((?!_next|assets|en|ja|nishio|dashboard|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
        destination: '/nishio/:page',
      },
    ];
  },
};
