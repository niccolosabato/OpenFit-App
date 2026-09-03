import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

export default function SchedeScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <Text variant="title" style={{ paddingVertical: theme.space.lg }}>
        Schede
      </Text>
      <EmptyState icon="clipboard-list-outline" title="In arrivo" description="Questa sezione arriva nella prossima tappa." />
    </Screen>
  );
}
