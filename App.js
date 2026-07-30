import React, { Component, useState } from 'react';
import { StyleSheet, StatusBar, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { registerRootComponent } from 'expo';

// React Error Boundary para capturar cualquier excepción y prevenir cierres inesperados
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("PizzApp Mobile Captured Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>PizzApp Hermosillo</Text>
          <Text style={styles.errorText}>Se produjo un ajuste temporal de renderizado. Toca para reiniciar la interfaz.</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Reiniciar Aplicación</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const netlifyUrl = 'https://pizzappoficial.netlify.app';
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  const handleReload = () => {
    setHasError(false);
    setKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>PizzApp Móvil</Text>
          <Text style={styles.errorText}>No se pudo conectar con el servidor. Verifica tu conexión a internet e reintenta.</Text>
          <TouchableOpacity style={styles.button} onPress={handleReload} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Reintentar Conexión</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView 
          key={key}
          source={{ uri: netlifyUrl }}
          style={{ flex: 1, backgroundColor: '#000000' }}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          startInLoadingState={true}
          originWhitelist={['*']}
          allowsInlineMediaPlayback={true}
          mixedContentMode="always"
          androidLayerType="hardware"
          androidHardwareAccelerationDisabled={false}
          overScrollMode="never"
          thirdPartyCookiesEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          geolocationEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 15; RedMagic 11 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 PizzApp/1.0"
          onError={() => setHasError(true)}
          onRenderProcessGone={() => {
            setKey(prev => prev + 1);
            return true;
          }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e11d48" />
            </View>
          )}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

