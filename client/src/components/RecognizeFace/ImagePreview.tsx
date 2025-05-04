interface ImagePreviewProps {
    src: string;
    alt: string;
  }
  
  const ImagePreview = ({ src, alt }: ImagePreviewProps) => (
    <div className="mt-4">
      <img src={src} alt={alt} className="w-full h-auto rounded-lg shadow-lg" />
    </div>
  );
  
  export default ImagePreview;