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
  | 'ui.alpha_waves'
  | 'ui.flow_state'
  | 'ui.drone_synth'
  | 'ui.audio_8d'
  | 'ui.account_menu'
  | 'ui.account'
  | 'ui.your_practice'
  | 'ui.delete_account_confirm'
  | 'ui.delete_account_start_error'
  | 'ui.delete_account_check_email'
  | 'ui.delete_account'
  | 'ui.settings_description'
  | 'ui.session'
  | 'ui.on'
  | 'ui.off'
  | 'ui.binaural_help'
  | 'ui.appearance'
  | 'ui.auto_dark'
  | 'ui.auto_light'
  | 'ui.dark'
  | 'ui.light'
  | 'ui.following_device'
  | 'ui.pattern'
  | 'ui.speed'
  | 'ui.seconds_per_phase'
  | 'ui.breath_speed'
  | 'ui.ai_suggestion'
  | 'ui.pause_session'
  | 'ui.start_session'
  | 'ui.sign_up'
  | 'ui.sign_out'
  | 'ui.match_system_default'
  | 'ui.dismiss'
  | 'ui.close'
  | 'ui.link'
  | 'ui.copy'
  | 'ui.copied'
  | 'ui.embed_on_site'
  | 'ui.copy_snippet'
  | 'ui.browse_embeds'
  | 'ui.change_language'
  | 'auth.create_free_account'
  | 'auth.save_progress'
  | 'auth.save_settings'
  | 'auth.sign_in_to_save'
  | 'auth.save_progress_question'
  | 'auth.sync_subtitle'
  | 'auth.save_and_sync'
  | 'auth.nice_session'
  | 'auth.minutes_of_calm'
  | 'auth.total_minutes'
  | 'auth.of_breathing_logged'
  | 'auth.continue_google'
  | 'auth.continue_apple'
  | 'auth.or'
  | 'auth.you'
  | 'auth.just_now'
  | 'auth.sessions_keep'
  | 'auth.streak_keep'
  | 'auth.session_count'
  | 'auth.sessions_count'
  | 'auth.local_only'
  | 'auth.email_address'
  | 'auth.send_link'
  | 'auth.save_with_email'
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
  'ui.alpha_waves': 'Alpha Waves (10Hz)',
  'ui.flow_state': 'Flow State',
  'ui.drone_synth': 'Drone Synth',
  'ui.audio_8d': '8D Audio',
  'ui.account_menu': 'Account menu',
  'ui.account': 'Account',
  'ui.your_practice': 'Your practice',
  'ui.delete_account_confirm': 'Permanently delete your account and all synced practice data? This cannot be undone.',
  'ui.delete_account_start_error': 'Could not start account deletion.',
  'ui.delete_account_check_email': 'Check your email to confirm permanent account deletion.',
  'ui.delete_account': 'Delete account',
  'ui.settings_description': 'Adjust modes, pacing, and personalization.',
  'ui.session': 'Session',
  'ui.on': 'On',
  'ui.off': 'Off',
  'ui.binaural_help': 'Best with headphones. Speakers mix both channels in air, which cancels the beat.',
  'ui.appearance': 'Appearance',
  'ui.auto_dark': 'Auto (Dark)',
  'ui.auto_light': 'Auto (Light)',
  'ui.dark': 'Dark',
  'ui.light': 'Light',
  'ui.following_device': 'Following your device preference.',
  'ui.pattern': 'Pattern',
  'ui.speed': 'Speed',
  'ui.seconds_per_phase': '{n}s per phase',
  'ui.breath_speed': 'Breath speed',
  'ui.ai_suggestion': 'AI Suggestion',
  'ui.pause_session': 'Pause Session',
  'ui.start_session': 'Start Session',
  'ui.sign_up': 'Sign up',
  'ui.sign_out': 'Sign out',
  'ui.match_system_default': 'Match system default',
  'ui.dismiss': 'Dismiss',
  'ui.close': 'Close',
  'ui.link': 'Link',
  'ui.copy': 'Copy',
  'ui.copied': 'Copied',
  'ui.embed_on_site': 'Embed on your site',
  'ui.copy_snippet': 'Copy snippet',
  'ui.browse_embeds': 'Browse all embeds →',
  'ui.change_language': 'Change language',
  'auth.create_free_account': 'Create a free account',
  'auth.save_progress': 'Save your progress',
  'auth.save_settings': 'Save settings across devices',
  'auth.sign_in_to_save': 'Sign in to save',
  'auth.save_progress_question': 'Save your progress?',
  'auth.sync_subtitle': 'Sync your breathing sessions and settings across devices.',
  'auth.save_and_sync': 'Save your progress and sync across devices.',
  'auth.nice_session': 'Nice session',
  'auth.minutes_of_calm': '{n} minutes of calm',
  'auth.total_minutes': '{n} min',
  'auth.of_breathing_logged': 'of breathing logged',
  'auth.continue_google': 'Continue with Google',
  'auth.continue_apple': 'Continue with Apple',
  'auth.or': 'or',
  'auth.you': 'you',
  'auth.just_now': 'just now',
  'auth.sessions_keep': "That's {n} sessions of calm, keep it?",
  'auth.streak_keep': "That's a {n}-day streak, keep it?",
  'auth.session_count': '{n} session',
  'auth.sessions_count': '{n} sessions',
  'auth.local_only': 'Your progress is kept on this device only. A free account saves it on any screen.',
  'auth.email_address': 'Email address',
  'auth.send_link': 'Send link',
  'auth.save_with_email': 'or save with email',
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
  'ui.alpha_waves': 'Ondas alfa (10 Hz)',
  'ui.flow_state': 'Estado de flujo',
  'ui.drone_synth': 'Sintetizador drone',
  'ui.audio_8d': 'Audio 8D',
  'ui.account_menu': 'Menú de cuenta',
  'ui.account': 'Cuenta',
  'ui.your_practice': 'Tu práctica',
  'ui.delete_account_confirm': '¿Eliminar permanentemente tu cuenta y todos los datos de práctica sincronizados? Esta acción no se puede deshacer.',
  'ui.delete_account_start_error': 'No se pudo iniciar la eliminación de la cuenta.',
  'ui.delete_account_check_email': 'Revisa tu correo para confirmar la eliminación permanente de la cuenta.',
  'ui.delete_account': 'Eliminar cuenta',
  'ui.settings_description': 'Ajusta los modos, el ritmo y la personalización.',
  'ui.session': 'Sesión',
  'ui.on': 'Activado',
  'ui.off': 'Desactivado',
  'ui.binaural_help': 'Funciona mejor con auriculares. Los altavoces mezclan ambos canales en el aire, lo que anula el pulso binaural.',
  'ui.appearance': 'Apariencia',
  'ui.auto_dark': 'Automático (oscuro)',
  'ui.auto_light': 'Automático (claro)',
  'ui.dark': 'Oscuro',
  'ui.light': 'Claro',
  'ui.following_device': 'Siguiendo la preferencia de tu dispositivo.',
  'ui.pattern': 'Patrón',
  'ui.speed': 'Velocidad',
  'ui.seconds_per_phase': '{n}s por fase',
  'ui.breath_speed': 'Velocidad de respiración',
  'ui.ai_suggestion': 'Sugerencia de IA',
  'ui.pause_session': 'Pausar sesión',
  'ui.start_session': 'Comenzar sesión',
  'ui.sign_up': 'Registrarse',
  'ui.sign_out': 'Cerrar sesion',
  'ui.match_system_default': 'Usar preferencia del sistema',
  'ui.dismiss': 'Descartar',
  'ui.close': 'Cerrar',
  'ui.link': 'Enlace',
  'ui.copy': 'Copiar',
  'ui.copied': 'Copiado',
  'ui.embed_on_site': 'Insertar en tu sitio',
  'ui.copy_snippet': 'Copiar código',
  'ui.browse_embeds': 'Ver todas las inserciones →',
  'ui.change_language': 'Cambiar idioma',
  'auth.create_free_account': 'Crear una cuenta gratis',
  'auth.save_progress': 'Guarda tu progreso',
  'auth.save_settings': 'Guardar ajustes en todos tus dispositivos',
  'auth.sign_in_to_save': 'Inicia sesión para guardar',
  'auth.save_progress_question': '¿Guardar tu progreso?',
  'auth.sync_subtitle': 'Sincroniza tus sesiones de respiracion y ajustes entre dispositivos.',
  'auth.save_and_sync': 'Guarda tu progreso y sincroniza entre dispositivos.',
  'auth.nice_session': 'Buena sesion',
  'auth.minutes_of_calm': '{n} minutos de calma',
  'auth.total_minutes': '{n} min',
  'auth.of_breathing_logged': 'de respiracion registrados',
  'auth.continue_google': 'Continuar con Google',
  'auth.continue_apple': 'Continuar con Apple',
  'auth.or': 'o',
  'auth.you': 'tú',
  'auth.just_now': 'ahora mismo',
  'auth.sessions_keep': 'Ya llevas {n} sesiones de calma. ¿Quieres conservarlas?',
  'auth.streak_keep': 'Ya llevas una racha de {n} días. ¿Quieres conservarla?',
  'auth.session_count': '{n} sesión',
  'auth.sessions_count': '{n} sesiones',
  'auth.local_only': 'Tu progreso solo se guarda en este dispositivo. Con una cuenta gratuita puedes acceder a él desde cualquier pantalla.',
  'auth.email_address': 'Correo electrónico',
  'auth.send_link': 'Enviar enlace',
  'auth.save_with_email': 'o guarda con tu correo electrónico',
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
  'ui.alpha_waves': 'Ondes alpha (10 Hz)',
  'ui.flow_state': 'État de flow',
  'ui.drone_synth': 'Synthétiseur drone',
  'ui.audio_8d': 'Audio 8D',
  'ui.account_menu': 'Menu du compte',
  'ui.account': 'Compte',
  'ui.your_practice': 'Votre pratique',
  'ui.delete_account_confirm': 'Supprimer définitivement votre compte et toutes les données de pratique synchronisées ? Cette action est irréversible.',
  'ui.delete_account_start_error': 'Impossible de lancer la suppression du compte.',
  'ui.delete_account_check_email': 'Consultez votre e-mail pour confirmer la suppression définitive du compte.',
  'ui.delete_account': 'Supprimer le compte',
  'ui.settings_description': 'Réglez les modes, le rythme et la personnalisation.',
  'ui.session': 'Session',
  'ui.on': 'Activé',
  'ui.off': 'Désactivé',
  'ui.binaural_help': 'Idéal avec un casque. Les haut-parleurs mélangent les deux canaux dans l’air, ce qui annule le battement.',
  'ui.appearance': 'Apparence',
  'ui.auto_dark': 'Automatique (sombre)',
  'ui.auto_light': 'Automatique (clair)',
  'ui.dark': 'Sombre',
  'ui.light': 'Clair',
  'ui.following_device': 'Selon les préférences de votre appareil.',
  'ui.pattern': 'Schéma',
  'ui.speed': 'Vitesse',
  'ui.seconds_per_phase': '{n} s par phase',
  'ui.breath_speed': 'Vitesse de respiration',
  'ui.ai_suggestion': 'Suggestion de l’IA',
  'ui.pause_session': 'Mettre la session en pause',
  'ui.start_session': 'Démarrer la session',
  'ui.sign_up': 'S inscrire',
  'ui.sign_out': 'Se deconnecter',
  'ui.match_system_default': 'Suivre le systeme',
  'ui.dismiss': 'Fermer',
  'ui.close': 'Fermer',
  'ui.link': 'Lien',
  'ui.copy': 'Copier',
  'ui.copied': 'Copié',
  'ui.embed_on_site': 'Intégrer sur votre site',
  'ui.copy_snippet': 'Copier le code',
  'ui.browse_embeds': 'Voir toutes les intégrations →',
  'ui.change_language': 'Changer de langue',
  'auth.create_free_account': 'Créer un compte gratuit',
  'auth.save_progress': 'Enregistrez votre progression',
  'auth.save_settings': 'Enregistrer les réglages sur tous vos appareils',
  'auth.sign_in_to_save': 'Connectez-vous pour enregistrer',
  'auth.save_progress_question': 'Enregistrer votre progression ?',
  'auth.sync_subtitle': 'Synchronisez vos sessions de respiration et vos reglages sur tous vos appareils.',
  'auth.save_and_sync': 'Enregistrez votre progression et synchronisez sur tous vos appareils.',
  'auth.nice_session': 'Belle session',
  'auth.minutes_of_calm': '{n} minutes de calme',
  'auth.total_minutes': '{n} min',
  'auth.of_breathing_logged': 'de respiration enregistrees',
  'auth.continue_google': 'Continuer avec Google',
  'auth.continue_apple': 'Continuer avec Apple',
  'auth.or': 'ou',
  'auth.you': 'vous',
  'auth.just_now': 'à l’instant',
  'auth.sessions_keep': 'Vous avez déjà {n} séances de calme. Les conserver ?',
  'auth.streak_keep': 'C’est une série de {n} jours. La conserver ?',
  'auth.session_count': '{n} séance',
  'auth.sessions_count': '{n} séances',
  'auth.local_only': 'Votre progression est conservée uniquement sur cet appareil. Un compte gratuit permet de la retrouver sur tous vos écrans.',
  'auth.email_address': 'Adresse e-mail',
  'auth.send_link': 'Envoyer le lien',
  'auth.save_with_email': 'ou enregistrer avec votre e-mail',
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
  'ui.alpha_waves': 'Alphawellen (10 Hz)',
  'ui.flow_state': 'Flow-Zustand',
  'ui.drone_synth': 'Drone-Synthesizer',
  'ui.audio_8d': '8D-Audio',
  'ui.account_menu': 'Kontomenü',
  'ui.account': 'Konto',
  'ui.your_practice': 'Deine Atemübungen',
  'ui.delete_account_confirm': 'Konto und alle synchronisierten Übungsdaten dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.',
  'ui.delete_account_start_error': 'Die Kontolöschung konnte nicht gestartet werden.',
  'ui.delete_account_check_email': 'Prüfe deine E-Mail, um die dauerhafte Kontolöschung zu bestätigen.',
  'ui.delete_account': 'Konto löschen',
  'ui.settings_description': 'Modi, Tempo und Personalisierung anpassen.',
  'ui.session': 'Sitzung',
  'ui.on': 'Ein',
  'ui.off': 'Aus',
  'ui.binaural_help': 'Am besten mit Kopfhörern. Lautsprecher mischen beide Kanäle in der Luft, wodurch der binaurale Effekt verloren geht.',
  'ui.appearance': 'Erscheinungsbild',
  'ui.auto_dark': 'Automatisch (dunkel)',
  'ui.auto_light': 'Automatisch (hell)',
  'ui.dark': 'Dunkel',
  'ui.light': 'Hell',
  'ui.following_device': 'Geräteeinstellung wird verwendet.',
  'ui.pattern': 'Atemmuster',
  'ui.speed': 'Geschwindigkeit',
  'ui.seconds_per_phase': '{n} s pro Phase',
  'ui.breath_speed': 'Atemgeschwindigkeit',
  'ui.ai_suggestion': 'KI-Vorschlag',
  'ui.pause_session': 'Sitzung pausieren',
  'ui.start_session': 'Sitzung starten',
  'ui.sign_up': 'Registrieren',
  'ui.sign_out': 'Abmelden',
  'ui.match_system_default': 'Systemeinstellung verwenden',
  'ui.dismiss': 'Schliessen',
  'ui.close': 'Schließen',
  'ui.link': 'Link',
  'ui.copy': 'Kopieren',
  'ui.copied': 'Kopiert',
  'ui.embed_on_site': 'Auf Ihrer Website einbetten',
  'ui.copy_snippet': 'Code kopieren',
  'ui.browse_embeds': 'Alle Einbettungen ansehen →',
  'ui.change_language': 'Sprache ändern',
  'auth.create_free_account': 'Kostenloses Konto erstellen',
  'auth.save_progress': 'Fortschritt speichern',
  'auth.save_settings': 'Einstellungen geräteübergreifend speichern',
  'auth.sign_in_to_save': 'Zum Speichern anmelden',
  'auth.save_progress_question': 'Fortschritt speichern?',
  'auth.sync_subtitle': 'Synchronisiere deine Atemsitzungen und Einstellungen auf allen Geraeten.',
  'auth.save_and_sync': 'Speichere deinen Fortschritt und synchronisiere auf allen Geraeten.',
  'auth.nice_session': 'Gute Sitzung',
  'auth.minutes_of_calm': '{n} Minuten Ruhe',
  'auth.total_minutes': '{n} Min.',
  'auth.of_breathing_logged': 'Atmung protokolliert',
  'auth.continue_google': 'Mit Google fortfahren',
  'auth.continue_apple': 'Mit Apple fortfahren',
  'auth.or': 'oder',
  'auth.you': 'du',
  'auth.just_now': 'gerade eben',
  'auth.sessions_keep': 'Das sind {n} Sitzungen voller Ruhe. Möchtest du sie behalten?',
  'auth.streak_keep': 'Das ist eine {n}-Tage-Serie. Möchtest du sie behalten?',
  'auth.session_count': '{n} Sitzung',
  'auth.sessions_count': '{n} Sitzungen',
  'auth.local_only': 'Dein Fortschritt wird nur auf diesem Gerät gespeichert. Mit einem kostenlosen Konto kannst du ihn auf jedem Gerät abrufen.',
  'auth.email_address': 'E-Mail-Adresse',
  'auth.send_link': 'Link senden',
  'auth.save_with_email': 'oder mit E-Mail speichern',
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
  'ui.alpha_waves': 'Ondas alfa (10 Hz)',
  'ui.flow_state': 'Estado de fluxo',
  'ui.drone_synth': 'Sintetizador drone',
  'ui.audio_8d': 'Áudio 8D',
  'ui.account_menu': 'Menu da conta',
  'ui.account': 'Conta',
  'ui.your_practice': 'Sua prática',
  'ui.delete_account_confirm': 'Excluir permanentemente sua conta e todos os dados de prática sincronizados? Esta ação não pode ser desfeita.',
  'ui.delete_account_start_error': 'Não foi possível iniciar a exclusão da conta.',
  'ui.delete_account_check_email': 'Verifique seu e-mail para confirmar a exclusão permanente da conta.',
  'ui.delete_account': 'Excluir conta',
  'ui.settings_description': 'Ajuste os modos, o ritmo e a personalização.',
  'ui.session': 'Sessão',
  'ui.on': 'Ativado',
  'ui.off': 'Desativado',
  'ui.binaural_help': 'Melhor com fones de ouvido. Os alto-falantes misturam os dois canais no ar, o que cancela a batida.',
  'ui.appearance': 'Aparência',
  'ui.auto_dark': 'Automático (escuro)',
  'ui.auto_light': 'Automático (claro)',
  'ui.dark': 'Escuro',
  'ui.light': 'Claro',
  'ui.following_device': 'Seguindo a preferência do seu dispositivo.',
  'ui.pattern': 'Padrão',
  'ui.speed': 'Velocidade',
  'ui.seconds_per_phase': '{n}s por fase',
  'ui.breath_speed': 'Velocidade da respiração',
  'ui.ai_suggestion': 'Sugestão da IA',
  'ui.pause_session': 'Pausar sessão',
  'ui.start_session': 'Começar sessão',
  'ui.sign_up': 'Cadastrar-se',
  'ui.sign_out': 'Sair',
  'ui.match_system_default': 'Usar preferencia do sistema',
  'ui.dismiss': 'Dispensar',
  'ui.close': 'Fechar',
  'ui.link': 'Link',
  'ui.copy': 'Copiar',
  'ui.copied': 'Copiado',
  'ui.embed_on_site': 'Incorporar no seu site',
  'ui.copy_snippet': 'Copiar código',
  'ui.browse_embeds': 'Ver todas as incorporações →',
  'ui.change_language': 'Mudar idioma',
  'auth.create_free_account': 'Criar uma conta grátis',
  'auth.save_progress': 'Salve seu progresso',
  'auth.save_settings': 'Salvar configurações em todos os dispositivos',
  'auth.sign_in_to_save': 'Entre para salvar',
  'auth.save_progress_question': 'Salvar seu progresso?',
  'auth.sync_subtitle': 'Sincronize suas sessoes de respiracao e configuracoes entre dispositivos.',
  'auth.save_and_sync': 'Salve seu progresso e sincronize entre dispositivos.',
  'auth.nice_session': 'Boa sessao',
  'auth.minutes_of_calm': '{n} minutos de calma',
  'auth.total_minutes': '{n} min',
  'auth.of_breathing_logged': 'de respiracao registrados',
  'auth.continue_google': 'Continuar com Google',
  'auth.continue_apple': 'Continuar com Apple',
  'auth.or': 'ou',
  'auth.you': 'você',
  'auth.just_now': 'agora mesmo',
  'auth.sessions_keep': 'São {n} sessões de calma. Quer mantê-las?',
  'auth.streak_keep': 'É uma sequência de {n} dias. Quer mantê-la?',
  'auth.session_count': '{n} sessão',
  'auth.sessions_count': '{n} sessões',
  'auth.local_only': 'Seu progresso fica salvo apenas neste dispositivo. Uma conta gratuita permite acessá-lo em qualquer tela.',
  'auth.email_address': 'Endereço de e-mail',
  'auth.send_link': 'Enviar link',
  'auth.save_with_email': 'ou salvar com e-mail',
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
  'ui.alpha_waves': 'アルファ波（10Hz）',
  'ui.flow_state': 'フロー状態',
  'ui.drone_synth': 'ドローンシンセ',
  'ui.audio_8d': '8Dオーディオ',
  'ui.account_menu': 'アカウントメニュー',
  'ui.account': 'アカウント',
  'ui.your_practice': 'あなたの練習',
  'ui.delete_account_confirm': 'アカウントと同期済みの練習データをすべて完全に削除しますか？この操作は取り消せません。',
  'ui.delete_account_start_error': 'アカウントの削除を開始できませんでした。',
  'ui.delete_account_check_email': 'アカウントの完全な削除を確認するには、メールを確認してください。',
  'ui.delete_account': 'アカウントを削除',
  'ui.settings_description': 'モード、ペース、パーソナライズを調整します。',
  'ui.session': 'セッション',
  'ui.on': 'オン',
  'ui.off': 'オフ',
  'ui.binaural_help': 'ヘッドフォンの使用をおすすめします。スピーカーでは左右のチャンネルが空気中で混ざり、ビートが打ち消されます。',
  'ui.appearance': '外観',
  'ui.auto_dark': '自動（ダーク）',
  'ui.auto_light': '自動（ライト）',
  'ui.dark': 'ダーク',
  'ui.light': 'ライト',
  'ui.following_device': 'デバイスの設定に従っています。',
  'ui.pattern': 'パターン',
  'ui.speed': '速度',
  'ui.seconds_per_phase': '1フェーズあたり{n}秒',
  'ui.breath_speed': '呼吸速度',
  'ui.ai_suggestion': 'AIからの提案',
  'ui.pause_session': 'セッションを一時停止',
  'ui.start_session': 'セッションを開始',
  'ui.sign_up': '登録',
  'ui.sign_out': 'ログアウト',
  'ui.match_system_default': 'システム設定に合わせる',
  'ui.dismiss': '閉じる',
  'ui.close': '閉じる',
  'ui.link': 'リンク',
  'ui.copy': 'コピー',
  'ui.copied': 'コピーしました',
  'ui.embed_on_site': 'サイトに埋め込む',
  'ui.copy_snippet': 'コードをコピー',
  'ui.browse_embeds': 'すべての埋め込みを見る →',
  'ui.change_language': '言語を変更',
  'auth.create_free_account': '無料アカウントを作成',
  'auth.save_progress': '進捗を保存',
  'auth.save_settings': '設定をデバイス間で保存',
  'auth.sign_in_to_save': '保存するにはサインイン',
  'auth.save_progress_question': '進捗を保存しますか？',
  'auth.sync_subtitle': '呼吸セッションと設定をデバイス間で同期します。',
  'auth.save_and_sync': '進捗を保存してデバイス間で同期します。',
  'auth.nice_session': 'いいセッションでした',
  'auth.minutes_of_calm': '{n}分の穏やかな時間',
  'auth.total_minutes': '{n}分',
  'auth.of_breathing_logged': 'の呼吸を記録',
  'auth.continue_google': 'Googleで続ける',
  'auth.continue_apple': 'Appleで続ける',
  'auth.or': 'または',
  'auth.you': 'あなた',
  'auth.just_now': 'たった今',
  'auth.sessions_keep': '穏やかな時間を過ごしたセッションが{n}回あります。記録を残しますか？',
  'auth.streak_keep': '{n}日連続で続いています。記録を残しますか？',
  'auth.session_count': '{n}回のセッション',
  'auth.sessions_count': '{n}回のセッション',
  'auth.local_only': '進捗はこのデバイスにのみ保存されています。無料アカウントを作成すると、どのデバイスからでも保存した進捗を利用できます。',
  'auth.email_address': 'メールアドレス',
  'auth.send_link': 'リンクを送信',
  'auth.save_with_email': 'またはメールで保存',
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
  'ui.alpha_waves': '...',
  'ui.flow_state': '...',
  'ui.drone_synth': '...',
  'ui.audio_8d': '...',
  'ui.account_menu': '...',
  'ui.account': '...',
  'ui.your_practice': '...',
  'ui.delete_account_confirm': '...',
  'ui.delete_account_start_error': '...',
  'ui.delete_account_check_email': '...',
  'ui.delete_account': '...',
  'ui.settings_description': '...',
  'ui.session': '...',
  'ui.on': '...',
  'ui.off': '...',
  'ui.binaural_help': '...',
  'ui.appearance': '...',
  'ui.auto_dark': '...',
  'ui.auto_light': '...',
  'ui.dark': '...',
  'ui.light': '...',
  'ui.following_device': '...',
  'ui.pattern': '...',
  'ui.speed': '...',
  'ui.seconds_per_phase': '...',
  'ui.breath_speed': '...',
  'ui.ai_suggestion': '...',
  'ui.pause_session': '...',
  'ui.start_session': '...',
  'ui.sign_up': '...',
  'ui.sign_out': '...',
  'ui.match_system_default': '...',
  'ui.dismiss': '...',
  'ui.close': '...',
  'ui.link': '...',
  'ui.copy': '...',
  'ui.copied': '...',
  'ui.embed_on_site': '...',
  'ui.copy_snippet': '...',
  'ui.browse_embeds': '...',
  'ui.change_language': '...',
  'auth.create_free_account': '...',
  'auth.save_progress': '...',
  'auth.save_settings': '...',
  'auth.sign_in_to_save': '...',
  'auth.save_progress_question': '...',
  'auth.sync_subtitle': '...',
  'auth.save_and_sync': '...',
  'auth.nice_session': '...',
  'auth.minutes_of_calm': '...',
  'auth.total_minutes': '...',
  'auth.of_breathing_logged': '...',
  'auth.continue_google': '...',
  'auth.continue_apple': '...',
  'auth.or': '...',
  'auth.you': '...',
  'auth.just_now': '...',
  'auth.sessions_keep': '...',
  'auth.streak_keep': '...',
  'auth.session_count': '...',
  'auth.sessions_count': '...',
  'auth.local_only': '...',
  'auth.email_address': '...',
  'auth.send_link': '...',
  'auth.save_with_email': '...',
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
