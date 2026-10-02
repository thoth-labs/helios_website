/* Consentement cookies (CNIL) — Google Analytics n'est chargé qu'après acceptation. */
(function () {
    var GA_ID = 'G-S4L1F82Z5G';
    var STORAGE_KEY = 'helios-consent';
    var MAX_AGE_MS = 1000 * 60 * 60 * 24 * 182; // choix redemandé après 6 mois
    var gaLoaded = false;

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    function readChoice() {
        try {
            var c = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (c && (c.value === 'granted' || c.value === 'denied') && Date.now() - c.ts < MAX_AGE_MS) return c.value;
        } catch (e) {}
        return null;
    }

    function saveChoice(value) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: value, ts: Date.now() })); } catch (e) {}
    }

    function loadAnalytics() {
        window['ga-disable-' + GA_ID] = false;
        gtag('consent', 'update', { analytics_storage: 'granted' });
        if (gaLoaded) return;
        gaLoaded = true;
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
        gtag('js', new Date());
        gtag('config', GA_ID, {
            cookie_expires: 60 * 60 * 24 * 390, // 13 mois maximum (CNIL)
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
    }

    function removeAnalyticsCookies() {
        window['ga-disable-' + GA_ID] = true;
        gtag('consent', 'update', { analytics_storage: 'denied' });
        var parts = location.hostname.split('.');
        var domains = [''];
        for (var i = 0; i < parts.length - 1; i++) domains.push('; domain=.' + parts.slice(i).join('.'));
        document.cookie.split(';').forEach(function (c) {
            var name = c.split('=')[0].trim();
            if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
                domains.forEach(function (d) {
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
                });
            }
        });
    }

    function applyChoice(value) {
        saveChoice(value);
        if (value === 'granted') loadAnalytics(); else removeAnalyticsCookies();
        hideBanner();
        document.dispatchEvent(new CustomEvent('helios-consent-change', { detail: value }));
    }

    var banner;
    function showBanner() {
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'consent-banner';
            banner.setAttribute('role', 'dialog');
            banner.setAttribute('aria-live', 'polite');
            banner.setAttribute('aria-label', 'Gestion des cookies');
            banner.innerHTML =
                '<p class="consent-text"><strong>Cookies de mesure d\'audience</strong><br>' +
                'Avec votre accord, nous utilisons Google Analytics pour mesurer la fréquentation du site et l\'améliorer. ' +
                'Aucun cookie publicitaire n\'est déposé. Vous pouvez changer d\'avis à tout moment via « Gérer les cookies » en bas de page. ' +
                '<a href="politique-cookies.html">En savoir plus</a></p>' +
                '<div class="consent-actions">' +
                '<button type="button" class="consent-btn" data-consent="denied">Refuser</button>' +
                '<button type="button" class="consent-btn" data-consent="granted">Accepter</button>' +
                '</div>';
            banner.addEventListener('click', function (e) {
                var v = e.target.getAttribute('data-consent');
                if (v) applyChoice(v);
            });
            document.body.appendChild(banner);
        }
        banner.hidden = false;
    }

    function hideBanner() { if (banner) banner.hidden = true; }

    window.HeliosConsent = {
        get: readChoice,
        set: applyChoice,
        open: showBanner
    };

    var initial = readChoice();
    if (initial === 'granted') loadAnalytics();

    function init() {
        if (!initial) showBanner();
        document.addEventListener('click', function (e) {
            var t = e.target.closest && e.target.closest('[data-consent-open]');
            if (t) { e.preventDefault(); showBanner(); }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
