import * as Notifications from 'expo-notifications';

/**
 * Come si comporta una notifica che arriva mentre l'app è aperta.
 *
 * Il suono sì — è il segnale che il recupero è finito — ma niente banner: la
 * schermata della sessione mostra già il countdown, e vedersi coprire i campi
 * da un avviso mentre si registra una serie sarebbe solo fastidioso.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});
