import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // URL del sitio oficial desplegado en Netlify
  // CAMBIA ESTA URL POR TU URL DE NETLIFY REAL:
  const netlifyUrl = 'https://pizzappoficial.netlify.app';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <WebView 
        source={{ uri: netlifyUrl }}
        style={{ flex: 1 }}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        startInLoadingState={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
