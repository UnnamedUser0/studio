import re

# Read the file
with open(r'src\components\map\pizza-map.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new simple function
new_function = '''  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Error de ubicación',
        description: 'La geolocalización no está soportada por tu navegador.',
      });
      return;
    }

    toast({
      title: 'Obteniendo ubicación...',
    });

    // Simple and fast like Google Maps
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Location: ${latitude}, ${longitude} (Accuracy: ${accuracy}m)`);

        const latlng = new L.LatLng(latitude, longitude);
        setUserLocation({ lat: latitude, lng: longitude });

        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.setLatLng(latlng);
        } else {
          myLocationMarkerRef.current = L.marker(latlng, { icon: myLocationIcon }).addTo(map);
        }

        map.flyTo(latlng, 16);
        onLocateUser({ lat: latitude, lng: longitude });

        toast({
          title: 'Ubicación encontrada',
          description: `Precisión: ${accuracy.toFixed(0)} metros`,
        });
      },
      (error) => {
        console.error("Geolocation error:", error.code, error.message);

        let errorMessage = 'No se pudo obtener tu ubicación.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso denegado. Por favor habilita la ubicación en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
            break;
        }

        toast({
          variant: 'destructive',
          title: 'Error de ubicación',
          description: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // Accept recent cached position (like Google Maps)
      }
    );
  };'''

# Use regex to find and replace the entire function
pattern = r'  const handleLocateMe = \(\) => \{.*?\n  \};'
content_new = re.sub(pattern, new_function, content, flags=re.DOTALL)

# Write back
with open(r'src\components\map\pizza-map.tsx', 'w', encoding='utf-8') as f:
    f.write(content_new)

print("Replacement complete!")
