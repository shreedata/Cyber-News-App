import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.secondary }]}
        onPress={signOut}>
        <Text style={[styles.buttonText, { color: theme.text }]}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
