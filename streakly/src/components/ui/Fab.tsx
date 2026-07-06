import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useColors } from '../../theme/useColors';

interface FabProps {
  onPress: () => void;
}

export function Fab({ onPress }: FabProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && { transform: [{ scale: 0.94 }] }]}
      accessibilityLabel="Add new"
    >
      <View style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Plus color={colors.primaryForeground} size={26} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 24,
    bottom: 120, // clear of the floating tab bar
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
});
