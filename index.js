import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent llama a AppRegistry.registerComponent('main', () => App)
// e inicializa los polyfills globales (Expo.fx) requeridos por el motor Hermes de Android.
registerRootComponent(App);
