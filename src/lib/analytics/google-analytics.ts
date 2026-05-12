export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-53DLCBMRL3";

export const GOOGLE_ANALYTICS_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;

export const GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GOOGLE_ANALYTICS_MEASUREMENT_ID}',{send_page_view:false});`;
