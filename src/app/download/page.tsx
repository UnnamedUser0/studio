import DownloadApp from '@/components/layout/download-app';

export const metadata = {
  title: 'Descargar PizzApp - Hermosillo Pizza Finder',
  description: 'Descarga la aplicación oficial de PizzApp para Windows y celulares.',
};

export default function DownloadPage() {
  return (
    <div className="py-12 md:py-24">
      <DownloadApp />
    </div>
  );
}
