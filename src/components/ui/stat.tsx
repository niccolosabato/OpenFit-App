import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text, type TextTone } from './text';

/**
 * Coppia etichetta/valore per un dato numerico: durata, volume, serie.
 *
 * Usato ovunque un allenamento va riassunto in due o tre numeri — sessione
 * live, storico, riepilogo di "Oggi" — perché lo stesso dato si legga allo
 * stesso modo in tutta l'app.
 *
 * L'etichetta sta **sopra** il valore e non sotto: si legge cosa si sta
 * guardando prima del numero, e le colonne di una riga di statistiche restano
 * allineate anche quando un valore va a capo.
 */
export function Stat({
  label,
  value,
  size = 'md',
  tone = 'default',
  fill,
  style,
}: {
  label: string;
  value: string;
  /** `md`: intestazione di sessione, dove il numero è il punto focale.
   *  `sm`: riepilogo dentro una card, accanto ad altro contenuto. */
  size?: 'md' | 'sm';
  tone?: TextTone;
  /** Si prende tutto lo spazio che resta: per righe che devono occupare
   *  l'intera larghezza in parti uguali (l'intestazione della sessione). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View style={[fill && { flex: 1 }, { gap: theme.space.xs }, style]}>
      <Text variant="label" tone="faint" numberOfLines={1}>
        {label}
      </Text>
      <Text variant={size === 'md' ? 'metric' : 'heading'} tone={tone} numeric numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function StatRow({
  items,
  size = 'md',
  fill = false,
  gap,
}: {
  items: { label: string; value: string; tone?: TextTone }[];
  size?: 'md' | 'sm';
  fill?: boolean;
  gap?: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: gap ?? (fill ? theme.space.md : theme.space.xl) }}>
      {items.map((item) => (
        <Stat
          key={item.label}
          label={item.label}
          value={item.value}
          tone={item.tone}
          size={size}
          fill={fill}
        />
      ))}
    </View>
  );
}
