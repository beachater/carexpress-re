import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Background from '../../components/Background';

export default function PrescriptionsScreen() {
  return (
    <Background>
    <View style={styles.container}>
      <Text style={styles.text}>QR Screen</Text>
    </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
