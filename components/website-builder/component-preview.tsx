import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useWebsiteStore } from '@/store/websiteStore';

export function ComponentPreview() {
  const { website, activeComponent } = useWebsiteStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const component = website.components.find((c) => c.id === activeComponent);
  
  // Effet pour mettre à jour l'iframe quand le composant change
  useEffect(() => {
    if (iframeRef.current && component) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${component.content}
          </body>
          </html>
        `);
        iframeDoc.close();
      }
    }
  }, [component]);
  
  if (!component) {
    return (
      <div className="h-full flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
        <p className="text-gray-500">
          Sélectionnez un composant ou créez-en un nouveau via la conversation.
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-medium mb-2">
        Prévisualisation: {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
      </h2>
      
      <Card className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Component Preview"
        />
      </Card>
    </div>
  );
}