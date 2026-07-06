import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useColors } from '../../theme/useColors';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function FormModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: FormModalProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border + '40' }]}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[styles.close, { backgroundColor: colors.secondary }]}
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 2 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 0 },
  bodyContent: { paddingBottom: 8 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
