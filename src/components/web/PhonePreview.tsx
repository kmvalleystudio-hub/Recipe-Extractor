import { Platform, View, Text, StyleSheet, useWindowDimensions } from 'react-native';

interface PhonePreviewProps {
  children: React.ReactNode;
}

/**
 * On web, wraps the app in a phone-sized frame for local preview on Windows.
 * On native platforms, renders children unchanged.
 */
export function PhonePreview({ children }: PhonePreviewProps) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const { height: windowHeight } = useWindowDimensions();
  const phoneHeight = Math.min(844, windowHeight - 48);

  return (
    <View style={styles.page}>
      <View style={styles.label}>
        <Text style={styles.labelText}>Recipe Extractor — phone preview</Text>
      </View>
      <View style={[styles.phone, { height: phoneHeight }]}>
        <View style={styles.notch} />
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    minHeight: '100vh' as unknown as number,
    width: '100%' as unknown as number,
    paddingVertical: 24,
  },
  label: {
    marginBottom: 12,
  },
  labelText: {
    color: '#a3a3a3',
    fontSize: 13,
    fontFamily: 'system-ui, sans-serif',
  },
  phone: {
    width: 390,
    maxWidth: '100%' as unknown as number,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#404040',
    backgroundColor: '#000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  notch: {
    height: 28,
    backgroundColor: '#000',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    width: 120,
    alignSelf: 'center',
    zIndex: 10,
    marginTop: 0,
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});
