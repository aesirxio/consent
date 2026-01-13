(function (w, d) {
  let loaded = false;

  w.AesirxConsent = {
    show() {
      if (loaded) return;
      loaded = true;

      const script = d.createElement('script');
      script.type = 'module'; // REQUIRED
      script.src = w.aesirxConsentConfig?.uiEntry;
      d.head.appendChild(script); // head is safer for modules
    },
  };

  // auto-show unless already consented
  if (!w.aesirxConsentAlreadyAccepted) {
    w.AesirxConsent.show();
  }
})(window, document);
