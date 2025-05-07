import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function Background({ children, style }: Props) {
  return (
    <ImageBackground
      source={require('../assets/images/iniBG.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Gradient Overlay (white at bottom) */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: .1}}
        end={{ x: 0.5, y: .6 }}
      />

      <View style={[styles.overlay, style]}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
  },
});
