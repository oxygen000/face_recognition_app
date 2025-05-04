import React, { ReactNode } from "react";

interface NewspaperProps {
  title: string;
  headline: string;
  subheading?: string;
  imageSrc?: string;
  imageAlt?: string;
  children: ReactNode;
}

/**
 * Newspaper styled layout component
 */
const Newspaper: React.FC<NewspaperProps> = ({
  title,
  headline,
  subheading,
  imageSrc,
  imageAlt,
  children,
}) => {
  return (
    <div className="max-w-4xl mx-auto text-gray-800 bg-white rounded-lg p-6 shadow-md font-serif">
      {/* Newspaper header */}
      <div className="border-b-2 border-black pb-2 mb-4">
        <h1 className="text-4xl font-bold text-center uppercase tracking-wider">
          {title}
        </h1>
      </div>

      {/* Main headline */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{headline}</h2>
        {subheading && <p className="text-lg text-gray-800">{subheading}</p>}
      </div>

      {/* Featured image */}
      {imageSrc && (
        <div className="mb-6 flex justify-center">
          <img
            src={imageSrc}
            alt={imageAlt || headline}
            className="max-w-full h-auto max-h-96 object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className="newspaper-content space-y-4 text-gray-800 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default Newspaper;
