// Apply the persisted locale before React starts so the initial document
// metadata never flashes the Russian fallback for KZ/EN visitors.
(function () {
  var lang = 'ru';
  try {
    var stored = window.localStorage.getItem('ecopay-language');
    if (stored === 'kz' || stored === 'en' || stored === 'ru') lang = stored;
  } catch (_) {
    // Storage can be unavailable; the Russian HTML defaults stay valid.
  }
  var meta = document.querySelector('meta[name="description"]');
  var metadata = {
    ru: {
      htmlLang: 'ru',
      title: 'EcoPay - платите меньше за семейные подписки',
      description: 'EcoPay - делите семейные подписки и платите в 2–6 раз меньше. EcoPay временно удерживает деньги до выплаты владельцу.'
    },
    kz: {
      htmlLang: 'kk',
      title: 'EcoPay - отбасылық жазылымдарға азырақ төлеңіз',
      description: 'EcoPay - отбасылық жазылымдарды бөлісіп, 2–6 есе аз төлеңіз. EcoPay ақшаны иесіне аударғанға дейін уақытша ұстайды.'
    },
    en: {
      htmlLang: 'en',
      title: 'EcoPay - pay less for family subscriptions',
      description: 'EcoPay - share family subscriptions and pay 2–6x less. EcoPay temporarily holds funds until the owner payout.'
    }
  }[lang];
  document.documentElement.lang = metadata.htmlLang;
  document.title = metadata.title;
  if (meta) meta.setAttribute('content', metadata.description);
})();
