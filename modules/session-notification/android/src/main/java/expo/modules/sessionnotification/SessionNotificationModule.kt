package expo.modules.sessionnotification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * La notifica fissa dell'allenamento in corso.
 *
 * È una notifica "ongoing": resta nella tendina per tutta la seduta e non si
 * può scartare con uno swipe. Quando è attivo un recupero porta il cronometro
 * nativo di Android (`setUsesChronometer` + `setChronometerCountDown`), così
 * il countdown scorre anche ad app sospesa senza che il JavaScript resti vivo
 * — non serve un foreground service.
 *
 * Il canale è a importanza bassa e silenzioso: la notifica informa e si
 * aggiorna spesso, ma non deve suonare. Per il fine recupero c'è già la
 * notifica separata di `expo-notifications`.
 *
 * Una nota per chi tocca questa classe: le notifiche ongoing create così
 * spariscono se qualcuno chiama `dismissAllNotificationsAsync` di
 * `expo-notifications` (la tendina è una sola). È voluto il riallineamento
 * dopo la pulizia, non un caso da "semplificare".
 */
class SessionNotificationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SessionNotification")

    AsyncFunction("present") { title: String, body: String, timestamp: Double?, countdown: Boolean ->
      present(title, body, timestamp, countdown)
    }

    AsyncFunction("cancel") {
      NotificationManagerCompat.from(context()).cancel(NOTIFICATION_ID)
    }
  }

  private fun context(): Context =
    appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun present(title: String, body: String, timestamp: Double?, countdown: Boolean) {
    val context = context()
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return

    ensureChannel(context)

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(body)
      // L'icona dell'app, come per le notifiche di expo-notifications: non
      // c'è (ancora) un'icona monocroma dedicata.
      .setSmallIcon(context.applicationInfo.icon)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setAutoCancel(false)
      .setSilent(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      // L'accento dell'app, lo stesso di `app.json`.
      .setColor(ACCENT_COLOR)

    if (timestamp != null) {
      builder.setWhen(timestamp.toLong())
      builder.setShowWhen(true)
      builder.setUsesChronometer(true)
      if (countdown) {
        builder.setChronometerCountDown(true)
      }
    } else {
      // In pausa non c'è un countdown da mostrare: il tempo è scritto nel
      // testo, che essendo fermo non invecchia.
      builder.setShowWhen(false)
    }

    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { intent ->
      builder.setContentIntent(
        PendingIntent.getActivity(
          context,
          0,
          intent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        ),
      )
    }

    try {
      manager.notify(NOTIFICATION_ID, builder.build())
    } catch (_: SecurityException) {
      // Permesso revocato fra il controllo e la pubblicazione: non c'è niente
      // da salvare, la prossima sessione riproverà.
    }
  }

  /**
   * Il canale si crea una volta sola e resta com'è: Android ne cristallizza le
   * impostazioni alla creazione. Per cambiarne una serve un id nuovo — come
   * per i canali del timer di recupero.
   */
  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return

    val channel = NotificationChannel(
      CHANNEL_ID,
      "Allenamento in corso",
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "La sessione in corso e il timer di recupero"
      setShowBadge(false)
      enableVibration(false)
      setSound(null, null)
    }

    manager.createNotificationChannel(channel)
  }

  private companion object {
    const val CHANNEL_ID = "session-ongoing"
    const val NOTIFICATION_ID = 0x0F17
    const val ACCENT_COLOR = 0xFFC9F53A.toInt()
  }
}