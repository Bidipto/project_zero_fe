import dynamic from 'next/dynamic';

const CircularGallery = dynamic(() => import('./CircularGallery'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-800/50 rounded-3xl animate-pulse" />
});

interface CircularGalleryWrapperProps {
  items?: Array<{ image: string; text: string }>;
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
}

export default function CircularGalleryWrapper(props: CircularGalleryWrapperProps) {
  return <CircularGallery {...props} />;
} 