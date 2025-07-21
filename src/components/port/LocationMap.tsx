import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
  locationLink?: string;
  readOnly?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({ locationLink, readOnly = false }) => {
  // Extract Google Maps embed URL from the location link
  const getEmbedUrl = (link: string): string | null => {
    // Check if link is valid before attempting to parse
    if (!link || typeof link !== 'string' || link.trim() === '') {
      return null;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
    if (!urlPattern.test(link)) {
      return null;
    }

    try {
      // Ensure URL starts with http:// or https://
      const normalizedLink = link.startsWith('http') ? link : `https://${link}`;
      const url = new URL(normalizedLink);
      
      // Handle different Google Maps URL formats
      if (url.hostname.includes('google.com/maps')) {
        // If it's already a maps embed URL, return as is
        if (url.pathname.includes('/embed')) {
          return normalizedLink;
        }
        
        // Convert share URL to embed URL
        if (url.pathname.includes('/place/')) {
          const query = url.pathname + url.search;
          return `https://www.google.com/maps/embed${query}`;
        }
        
        // Convert coordinates URL to embed URL
        if (url.pathname.includes('@')) {
          const coords = url.pathname.split('@')[1]?.split(',');
          if (coords && coords.length >= 2) {
            return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15000!2d${coords[1]}!3d${coords[0]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2sin!4v1`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing location link:', error);
      return null;
    }
  };

  if (!locationLink) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">
          {readOnly 
            ? 'No location link provided' 
            : 'Add a Google Maps location link to display the port location'}
        </p>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(locationLink);

  if (!embedUrl) {
    return (
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200 text-center">
        <MapPin className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
        <p className="text-yellow-700">
          Invalid Google Maps link format. Please provide a valid Google Maps URL.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
      <iframe
        src={embedUrl}
        width="100%"
        height="450"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Port Location"
        className="w-full"
      />
    </div>
  );
};

export default LocationMap;