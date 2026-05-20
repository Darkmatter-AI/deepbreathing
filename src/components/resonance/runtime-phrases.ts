export type RuntimePhraseKey =
  | 'session.ready_to_start'
  | 'session.paused'
  | 'session.tap_enable_sound'
  | 'session.complete'
  | 'instruction.inhale_slowly'
  | 'instruction.inhale_again'
  | 'instruction.exhale'
  | 'instruction.exhale_fully'
  | 'instruction.inhale'
  | 'instruction.hold_your_breath'
  | 'instruction.deep_breath_in'
  | 'instruction.hold'
  | 'phase.ready'
  | 'phase.hold'
  | 'phase.inhale_again'
  | 'phase.inhale'
  | 'phase.exhale'
  | 'protocol.power_breathe'
  | 'protocol.round_complete'
  | 'protocol.complete'
  | 'ui.power_breath'
  | 'ui.round_of'
  | 'ui.breath_of'
  | 'ui.end_hold_recovery'
  | 'ui.sound_hint_no_audio'
  | 'ui.duration_sec'
  | 'ui.duration_min'
  | 'ui.settings'
  | 'ui.sound_off'
  | 'ui.sound_on'
  | 'ui.session_length'
  | 'ui.open'
  | 'ui.pause_to_change'
  | 'ui.pause_session_to_switch'
  | 'ui.binaural_beats'
  | 'ui.sign_up'
  | 'ui.sign_out'
  | 'ui.match_system_default'
  | 'ui.dismiss'
  | 'auth.save_progress'
  | 'auth.sync_subtitle'
  | 'auth.save_and_sync'
  | 'auth.nice_session'
  | 'auth.minutes_of_calm'
  | 'auth.total_minutes'
  | 'auth.of_breathing_logged'
  | 'auth.continue_google'
  | 'auth.or'
  | 'auth.enter_email'
  | 'auth.send_magic_link'
  | 'auth.sending_link'
  | 'auth.not_now'
  | 'auth.check_email'
  | 'auth.sent_link_to'
  | 'auth.something_went_wrong';

type LocaleTable = Record<RuntimePhraseKey, string>;

type ResolveSource = 'locale' | 'fallback_en';

export interface ResolvedPhrase {
  text: string;
  source: ResolveSource;
}

const EN: LocaleTable = {
  'session.ready_to_start': 'Ready to start?',
  'session.paused': 'Paused',
  'session.tap_enable_sound': 'Tap once to enable sound',
  'session.complete': 'Session complete',
  'instruction.inhale_slowly': 'Inhale slowly...',
  'instruction.inhale_again': 'Inhale again...',
  'instruction.exhale': 'Exhale...',
  'instruction.exhale_fully': 'Exhale fully...',
  'instruction.inhale': 'Inhale...',
  'instruction.hold_your_breath': 'Hold your breath...',
  'instruction.deep_breath_in': 'Deep breath in',
  'instruction.hold': 'Hold',
  'phase.ready': 'Ready',
  'phase.hold': 'Hold',
  'phase.inhale_again': 'Inhale Again',
  'phase.inhale': 'Inhale',
  'phase.exhale': 'Exhale',
  'protocol.power_breathe': 'Power breathe',
  'protocol.round_complete': 'Round {round} complete',
  'protocol.complete': 'Protocol complete!',
  'ui.power_breath': 'Power breath',
  'ui.round_of': 'Round {current} of {total}',
  'ui.breath_of': 'Breath {current} of {total}',
  'ui.end_hold_recovery': 'End Hold -> Recovery Breath',
  'ui.sound_hint_no_audio': 'If you do not hear any sound, make sure your phone is not on silent.',
  'ui.duration_sec': '{n}s',
  'ui.duration_min': '{n} min',
  'ui.settings': 'Settings',
  'ui.sound_off': 'Sound Off',
  'ui.sound_on': 'Sound On',
  'ui.session_length': 'Session length',
  'ui.open': 'Open',
  'ui.pause_to_change': 'Pause to change the session length.',
  'ui.pause_session_to_switch': 'Pause the session to switch modes, adjust pacing, or change length.',
  'ui.binaural_beats': 'Binaural beats',
  'ui.sign_up': 'Sign up',
  'ui.sign_out': 'Sign out',
  'ui.match_system_default': 'Match system default',
  'ui.dismiss': 'Dismiss',
  'auth.save_progress': 'Save your progress',
  'auth.sync_subtitle': 'Sync your breathing sessions and settings across devices.',
  'auth.save_and_sync': 'Save your progress and sync across devices.',
  'auth.nice_session': 'Nice session',
  'auth.minutes_of_calm': '{n} minutes of calm',
  'auth.total_minutes': '{n} min',
  'auth.of_breathing_logged': 'of breathing logged',
  'auth.continue_google': 'Continue with Google',
  'auth.or': 'or',
  'auth.enter_email': 'Enter your email',
  'auth.send_magic_link': 'Send magic link',
  'auth.sending_link': 'Sending link...',
  'auth.not_now': 'Not now',
  'auth.check_email': 'Check your email',
  'auth.sent_link_to': 'We sent a sign-in link to',
  'auth.something_went_wrong': 'Something went wrong. Please try again.'
};

const ES: LocaleTable = {
  'session.ready_to_start': 'Listo para comenzar?',
  'session.paused': 'En pausa',
  'session.tap_enable_sound': 'Toca una vez para activar el sonido',
  'session.complete': 'Sesion completada',
  'instruction.inhale_slowly': 'Inhala lentamente...',
  'instruction.inhale_again': 'Inhala de nuevo...',
  'instruction.exhale': 'Exhala...',
  'instruction.exhale_fully': 'Exhala por completo...',
  'instruction.inhale': 'Inhala...',
  'instruction.hold_your_breath': 'Aguanta la respiracion...',
  'instruction.deep_breath_in': 'Inhala profundo',
  'instruction.hold': 'Mantener',
  'phase.ready': 'Listo',
  'phase.hold': 'Mantener',
  'phase.inhale_again': 'Inhala de nuevo',
  'phase.inhale': 'Inhala',
  'phase.exhale': 'Exhala',
  'protocol.power_breathe': 'Respiracion intensa',
  'protocol.round_complete': 'Ronda {round} completada',
  'protocol.complete': 'Protocolo completado!',
  'ui.power_breath': 'Respiracion intensa',
  'ui.round_of': 'Ronda {current} de {total}',
  'ui.breath_of': 'Respiracion {current} de {total}',
  'ui.end_hold_recovery': 'Terminar pausa -> Respiracion de recuperacion',
  'ui.sound_hint_no_audio': 'Si no escuchas sonido, asegurate de que tu telefono no este en silencio.',
  'ui.duration_sec': '{n}s',
  'ui.duration_min': '{n} min',
  'ui.settings': 'Ajustes',
  'ui.sound_off': 'Sonido apagado',
  'ui.sound_on': 'Sonido encendido',
  'ui.session_length': 'Duracion de la sesion',
  'ui.open': 'Abierta',
  'ui.pause_to_change': 'Pausa para cambiar la duracion de la sesion.',
  'ui.pause_session_to_switch': 'Pausa la sesion para cambiar de modo, ajustar el ritmo o la duracion.',
  'ui.binaural_beats': 'Ondas binaurales',
  'ui.sign_up': 'Registrarse',
  'ui.sign_out': 'Cerrar sesion',
  'ui.match_system_default': 'Usar preferencia del sistema',
  'ui.dismiss': 'Descartar',
  'auth.save_progress': 'Guarda tu progreso',
  'auth.sync_subtitle': 'Sincroniza tus sesiones de respiracion y ajustes entre dispositivos.',
  'auth.save_and_sync': 'Guarda tu progreso y sincroniza entre dispositivos.',
  'auth.nice_session': 'Buena sesion',
  'auth.minutes_of_calm': '{n} minutos de calma',
  'auth.total_minutes': '{n} min',
  'auth.of_breathing_logged': 'de respiracion registrados',
  'auth.continue_google': 'Continuar con Google',
  'auth.or': 'o',
  'auth.enter_email': 'Introduce tu correo',
  'auth.send_magic_link': 'Enviar enlace magico',
  'auth.sending_link': 'Enviando enlace...',
  'auth.not_now': 'Ahora no',
  'auth.check_email': 'Revisa tu correo',
  'auth.sent_link_to': 'Enviamos un enlace de acceso a',
  'auth.something_went_wrong': 'Algo salio mal. Intentalo de nuevo.'
};

const FR: LocaleTable = {
  'session.ready_to_start': 'Pret a commencer?',
  'session.paused': 'En pause',
  'session.tap_enable_sound': 'Touchez une fois pour activer le son',
  'session.complete': 'Session terminee',
  'instruction.inhale_slowly': 'Inspirez lentement...',
  'instruction.inhale_again': 'Inspirez encore...',
  'instruction.exhale': 'Expirez...',
  'instruction.exhale_fully': 'Expirez completement...',
  'instruction.inhale': 'Inspirez...',
  'instruction.hold_your_breath': 'Retenez votre souffle...',
  'instruction.deep_breath_in': 'Grande inspiration',
  'instruction.hold': 'Retenez',
  'phase.ready': 'Pret',
  'phase.hold': 'Retenez',
  'phase.inhale_again': 'Inspirez encore',
  'phase.inhale': 'Inspirez',
  'phase.exhale': 'Expirez',
  'protocol.power_breathe': 'Respiration puissante',
  'protocol.round_complete': 'Cycle {round} termine',
  'protocol.complete': 'Protocole termine!',
  'ui.power_breath': 'Respiration puissante',
  'ui.round_of': 'Cycle {current} sur {total}',
  'ui.breath_of': 'Souffle {current} sur {total}',
  'ui.end_hold_recovery': 'Fin de retention -> Souffle de recuperation',
  'ui.sound_hint_no_audio': 'Si vous n entendez aucun son, verifiez que votre telephone n est pas en mode silencieux.',
  'ui.duration_sec': '{n}s',
  'ui.duration_min': '{n} min',
  'ui.settings': 'Parametres',
  'ui.sound_off': 'Son coupe',
  'ui.sound_on': 'Son active',
  'ui.session_length': 'Duree de la session',
  'ui.open': 'Ouverte',
  'ui.pause_to_change': 'Mettez en pause pour changer la duree de la session.',
  'ui.pause_session_to_switch': 'Mettez la session en pause pour changer de mode, ajuster le rythme ou la duree.',
  'ui.binaural_beats': 'Battements binauraux',
  'ui.sign_up': 'S inscrire',
  'ui.sign_out': 'Se deconnecter',
  'ui.match_system_default': 'Suivre le systeme',
  'ui.dismiss': 'Fermer',
  'auth.save_progress': 'Enregistrez votre progression',
  'auth.sync_subtitle': 'Synchronisez vos sessions de respiration et vos reglages sur tous vos appareils.',
  'auth.save_and_sync': 'Enregistrez votre progression et synchronisez sur tous vos appareils.',
  'auth.nice_session': 'Belle session',
  'auth.minutes_of_calm': '{n} minutes de calme',
  'auth.total_minutes': '{n} min',
  'auth.of_breathing_logged': 'de respiration enregistrees',
  'auth.continue_google': 'Continuer avec Google',
  'auth.or': 'ou',
  'auth.enter_email': 'Entrez votre e-mail',
  'auth.send_magic_link': 'Envoyer un lien magique',
  'auth.sending_link': 'Envoi du lien...',
  'auth.not_now': 'Pas maintenant',
  'auth.check_email': 'Verifiez votre e-mail',
  'auth.sent_link_to': 'Nous avons envoye un lien de connexion a',
  'auth.something_went_wrong': 'Une erreur s est produite. Veuillez reessayer.'
};

const DE: LocaleTable = {
  'session.ready_to_start': 'Bereit zum Start?',
  'session.paused': 'Pausiert',
  'session.tap_enable_sound': 'Einmal tippen, um Sound zu aktivieren',
  'session.complete': 'Sitzung abgeschlossen',
  'instruction.inhale_slowly': 'Langsam einatmen...',
  'instruction.inhale_again': 'Noch einmal einatmen...',
  'instruction.exhale': 'Ausatmen...',
  'instruction.exhale_fully': 'Vollstandig ausatmen...',
  'instruction.inhale': 'Einatmen...',
  'instruction.hold_your_breath': 'Atem anhalten...',
  'instruction.deep_breath_in': 'Tief einatmen',
  'instruction.hold': 'Halten',
  'phase.ready': 'Bereit',
  'phase.hold': 'Halten',
  'phase.inhale_again': 'Nochmals einatmen',
  'phase.inhale': 'Einatmen',
  'phase.exhale': 'Ausatmen',
  'protocol.power_breathe': 'Kraftatmung',
  'protocol.round_complete': 'Runde {round} abgeschlossen',
  'protocol.complete': 'Protokoll abgeschlossen!',
  'ui.power_breath': 'Kraftatmung',
  'ui.round_of': 'Runde {current} von {total}',
  'ui.breath_of': 'Atemzug {current} von {total}',
  'ui.end_hold_recovery': 'Halten beenden -> Erholungsatemzug',
  'ui.sound_hint_no_audio': 'Wenn du keinen Ton horst, stelle sicher, dass dein Telefon nicht stumm ist.',
  'ui.duration_sec': '{n} s',
  'ui.duration_min': '{n} Min.',
  'ui.settings': 'Einstellungen',
  'ui.sound_off': 'Ton aus',
  'ui.sound_on': 'Ton an',
  'ui.session_length': 'Sitzungsdauer',
  'ui.open': 'Offen',
  'ui.pause_to_change': 'Pausiere, um die Sitzungsdauer zu andern.',
  'ui.pause_session_to_switch': 'Pausiere die Sitzung, um den Modus, das Tempo oder die Dauer zu andern.',
  'ui.binaural_beats': 'Binaurale Beats',
  'ui.sign_up': 'Registrieren',
  'ui.sign_out': 'Abmelden',
  'ui.match_system_default': 'Systemeinstellung verwenden',
  'ui.dismiss': 'Schliessen',
  'auth.save_progress': 'Fortschritt speichern',
  'auth.sync_subtitle': 'Synchronisiere deine Atemsitzungen und Einstellungen auf allen Geraeten.',
  'auth.save_and_sync': 'Speichere deinen Fortschritt und synchronisiere auf allen Geraeten.',
  'auth.nice_session': 'Gute Sitzung',
  'auth.minutes_of_calm': '{n} Minuten Ruhe',
  'auth.total_minutes': '{n} Min.',
  'auth.of_breathing_logged': 'Atmung protokolliert',
  'auth.continue_google': 'Mit Google fortfahren',
  'auth.or': 'oder',
  'auth.enter_email': 'E-Mail eingeben',
  'auth.send_magic_link': 'Magic Link senden',
  'auth.sending_link': 'Link wird gesendet...',
  'auth.not_now': 'Nicht jetzt',
  'auth.check_email': 'E-Mail prufen',
  'auth.sent_link_to': 'Wir haben einen Anmeldelink gesendet an',
  'auth.something_went_wrong': 'Etwas ist schiefgelaufen. Bitte erneut versuchen.'
};

const PT: LocaleTable = {
  'session.ready_to_start': 'Pronto para comecar?',
  'session.paused': 'Pausado',
  'session.tap_enable_sound': 'Toque uma vez para ativar o som',
  'session.complete': 'Sessao concluida',
  'instruction.inhale_slowly': 'Inspire devagar...',
  'instruction.inhale_again': 'Inspire novamente...',
  'instruction.exhale': 'Expire...',
  'instruction.exhale_fully': 'Expire completamente...',
  'instruction.inhale': 'Inspire...',
  'instruction.hold_your_breath': 'Prenda a respiracao...',
  'instruction.deep_breath_in': 'Respire fundo',
  'instruction.hold': 'Segure',
  'phase.ready': 'Pronto',
  'phase.hold': 'Segure',
  'phase.inhale_again': 'Inspire novamente',
  'phase.inhale': 'Inspire',
  'phase.exhale': 'Expire',
  'protocol.power_breathe': 'Respiracao intensa',
  'protocol.round_complete': 'Rodada {round} concluida',
  'protocol.complete': 'Protocolo concluido!',
  'ui.power_breath': 'Respiracao intensa',
  'ui.round_of': 'Rodada {current} de {total}',
  'ui.breath_of': 'Respiracao {current} de {total}',
  'ui.end_hold_recovery': 'Encerrar pausa -> Respiracao de recuperacao',
  'ui.sound_hint_no_audio': 'Se voce nao ouvir som, confira se o telefone nao esta no silencioso.',
  'ui.duration_sec': '{n}s',
  'ui.duration_min': '{n} min',
  'ui.settings': 'Configuracoes',
  'ui.sound_off': 'Som desligado',
  'ui.sound_on': 'Som ligado',
  'ui.session_length': 'Duracao da sessao',
  'ui.open': 'Aberta',
  'ui.pause_to_change': 'Pause para alterar a duracao da sessao.',
  'ui.pause_session_to_switch': 'Pause a sessao para trocar de modo, ajustar o ritmo ou a duracao.',
  'ui.binaural_beats': 'Batidas binaurais',
  'ui.sign_up': 'Cadastrar-se',
  'ui.sign_out': 'Sair',
  'ui.match_system_default': 'Usar preferencia do sistema',
  'ui.dismiss': 'Dispensar',
  'auth.save_progress': 'Salve seu progresso',
  'auth.sync_subtitle': 'Sincronize suas sessoes de respiracao e configuracoes entre dispositivos.',
  'auth.save_and_sync': 'Salve seu progresso e sincronize entre dispositivos.',
  'auth.nice_session': 'Boa sessao',
  'auth.minutes_of_calm': '{n} minutos de calma',
  'auth.total_minutes': '{n} min',
  'auth.of_breathing_logged': 'de respiracao registrados',
  'auth.continue_google': 'Continuar com Google',
  'auth.or': 'ou',
  'auth.enter_email': 'Digite seu e-mail',
  'auth.send_magic_link': 'Enviar link magico',
  'auth.sending_link': 'Enviando link...',
  'auth.not_now': 'Agora nao',
  'auth.check_email': 'Verifique seu e-mail',
  'auth.sent_link_to': 'Enviamos um link de acesso para',
  'auth.something_went_wrong': 'Algo deu errado. Tente novamente.'
};

const JA: LocaleTable = {
  'session.ready_to_start': '始めますか？',
  'session.paused': '一時停止',
  'session.tap_enable_sound': 'タップして音を有効にする',
  'session.complete': 'セッション完了',
  'instruction.inhale_slowly': 'ゆっくり吸って...',
  'instruction.inhale_again': 'もう一度吸って...',
  'instruction.exhale': '吐いて...',
  'instruction.exhale_fully': '完全に吐いて...',
  'instruction.inhale': '吸って...',
  'instruction.hold_your_breath': '息を止めて...',
  'instruction.deep_breath_in': '深く吸って',
  'instruction.hold': '止める',
  'phase.ready': '準備',
  'phase.hold': '止める',
  'phase.inhale_again': 'もう一度吸う',
  'phase.inhale': '吸う',
  'phase.exhale': '吐く',
  'protocol.power_breathe': 'パワーブレス',
  'protocol.round_complete': 'ラウンド{round}完了',
  'protocol.complete': 'プロトコル完了！',
  'ui.power_breath': 'パワーブレス',
  'ui.round_of': 'ラウンド{current}/{total}',
  'ui.breath_of': '呼吸{current}/{total}',
  'ui.end_hold_recovery': '保持終了 → 回復呼吸',
  'ui.sound_hint_no_audio': '音が聞こえない場合は、スマートフォンがサイレントモードになっていないか確認してください。',
  'ui.duration_sec': '{n}秒',
  'ui.duration_min': '{n}分',
  'ui.settings': '設定',
  'ui.sound_off': 'サウンドオフ',
  'ui.sound_on': 'サウンドオン',
  'ui.session_length': 'セッション時間',
  'ui.open': '制限なし',
  'ui.pause_to_change': '一時停止してセッション時間を変更してください。',
  'ui.pause_session_to_switch': 'モード、ペース、時間を変更するにはセッションを一時停止してください。',
  'ui.binaural_beats': 'バイノーラルビート',
  'ui.sign_up': '登録',
  'ui.sign_out': 'ログアウト',
  'ui.match_system_default': 'システム設定に合わせる',
  'ui.dismiss': '閉じる',
  'auth.save_progress': '進捗を保存',
  'auth.sync_subtitle': '呼吸セッションと設定をデバイス間で同期します。',
  'auth.save_and_sync': '進捗を保存してデバイス間で同期します。',
  'auth.nice_session': 'いいセッションでした',
  'auth.minutes_of_calm': '{n}分の穏やかな時間',
  'auth.total_minutes': '{n}分',
  'auth.of_breathing_logged': 'の呼吸を記録',
  'auth.continue_google': 'Googleで続ける',
  'auth.or': 'または',
  'auth.enter_email': 'メールアドレスを入力',
  'auth.send_magic_link': 'マジックリンクを送信',
  'auth.sending_link': 'リンクを送信中...',
  'auth.not_now': 'あとで',
  'auth.check_email': 'メールを確認してください',
  'auth.sent_link_to': 'サインインリンクを送信しました：',
  'auth.something_went_wrong': '問題が発生しました。もう一度お試しください。'
};

const CATALOG: Record<string, LocaleTable> = {
  en: EN,
  es: ES,
  fr: FR,
  de: DE,
  pt: PT,
  ja: JA
};

const NEUTRAL_FALLBACKS: Record<RuntimePhraseKey, string> = {
  'session.ready_to_start': '...',
  'session.paused': '...',
  'session.tap_enable_sound': '...',
  'session.complete': '...',
  'instruction.inhale_slowly': '...',
  'instruction.inhale_again': '...',
  'instruction.exhale': '...',
  'instruction.exhale_fully': '...',
  'instruction.inhale': '...',
  'instruction.hold_your_breath': '...',
  'instruction.deep_breath_in': '...',
  'instruction.hold': '...',
  'phase.ready': '...',
  'phase.hold': '...',
  'phase.inhale_again': '...',
  'phase.inhale': '...',
  'phase.exhale': '...',
  'protocol.power_breathe': '...',
  'protocol.round_complete': '...',
  'protocol.complete': '...',
  'ui.power_breath': '...',
  'ui.round_of': '...',
  'ui.breath_of': '...',
  'ui.end_hold_recovery': '...',
  'ui.sound_hint_no_audio': '...',
  'ui.duration_sec': '...',
  'ui.duration_min': '...',
  'ui.settings': '...',
  'ui.sound_off': '...',
  'ui.sound_on': '...',
  'ui.session_length': '...',
  'ui.open': '...',
  'ui.pause_to_change': '...',
  'ui.pause_session_to_switch': '...',
  'ui.binaural_beats': '...',
  'ui.sign_up': '...',
  'ui.sign_out': '...',
  'ui.match_system_default': '...',
  'ui.dismiss': '...',
  'auth.save_progress': '...',
  'auth.sync_subtitle': '...',
  'auth.save_and_sync': '...',
  'auth.nice_session': '...',
  'auth.minutes_of_calm': '...',
  'auth.total_minutes': '...',
  'auth.of_breathing_logged': '...',
  'auth.continue_google': '...',
  'auth.or': '...',
  'auth.enter_email': '...',
  'auth.send_magic_link': '...',
  'auth.sending_link': '...',
  'auth.not_now': '...',
  'auth.check_email': '...',
  'auth.sent_link_to': '...',
  'auth.something_went_wrong': '...'
};

const TEMPLATE_VAR_RE = /\{(\w+)\}/g;

function applyTemplate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(TEMPLATE_VAR_RE, (_match, key: string) => String(vars[key] ?? ''));
}

function normalizeLocale(locale: string): string {
  const lower = locale.toLowerCase();
  if (CATALOG[lower]) return lower;
  const base = lower.split('-')[0];
  return CATALOG[base] ? base : 'en';
}

export function detectRuntimeLocale(): string {
  if (typeof window !== 'undefined') {
    const mtLang = window.__MT_CONFIG__?.lang;
    if (mtLang) return normalizeLocale(mtLang);

    const match = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
    if (match) return normalizeLocale(match[1]);
  }
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang?.trim();
    if (htmlLang) return normalizeLocale(htmlLang);
  }
  if (typeof navigator !== 'undefined') {
    const nav = navigator.language?.trim();
    if (nav) return normalizeLocale(nav);
  }
  return 'en';
}

export function createRuntimePhraseResolver(locale: string) {
  const normalized = normalizeLocale(locale);
  const localeTable = CATALOG[normalized] ?? EN;

  const resolve = (key: RuntimePhraseKey, vars?: Record<string, string | number>): ResolvedPhrase => {
    const template = localeTable[key];
    if (template) {
      return { text: applyTemplate(template, vars), source: 'locale' };
    }
    return { text: applyTemplate(EN[key], vars), source: 'fallback_en' };
  };

  const neutral = (key: RuntimePhraseKey) => NEUTRAL_FALLBACKS[key];

  return {
    locale: normalized,
    resolve,
    neutral
  };
}
