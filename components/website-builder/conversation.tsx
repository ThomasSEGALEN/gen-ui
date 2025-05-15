// /components/website-builder/Conversation.tsx
// Ajoutez ces modifications

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WebsiteComponent } from '@/types';
import { Badge } from '@/components/ui/badge';
import { createComponent, createMessage, generateId } from '@/lib/utils';
import { generateDemoComponent } from '@/components/website-builder/demo-component';
import { generateComponentCode } from '@/lib/ai';
import { useWebsiteStore } from '@/store/websiteStore';

export function Conversation() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiProvider, setApiProvider] = useState<string | null>(null);
  const [componentType, setComponentType] = useState<WebsiteComponent['type']>('section');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { 
    conversations, 
    activeConversation,
    website,
    addComponent,
    updateComponent,
    addConversation,
    updateConversation,
    setActiveComponent,
    setActiveConversation
  } = useWebsiteStore();
  
  const conversation = conversations.find((c) => c.id === activeConversation);
  const messages = conversation?.messages || [];
  const componentId = conversation?.componentId;
  
  // Effet pour détecter si nous sommes en mode édition
  useEffect(() => {
    if (activeConversation && componentId) {
      setIsEditMode(true);
      
      // Trouver le type du composant actif et mettre à jour le sélecteur
      const activeComp = website.components.find(c => c.id === componentId);
      if (activeComp) {
        setComponentType(activeComp.type);
      }
    } else {
      setIsEditMode(false);
    }
  }, [activeConversation, componentId, website.components]);
  
  // Fonction pour créer un nouveau composant (reset la conversation)
  const handleNewComponent = () => {
    setActiveConversation(null);
    setActiveComponent(null);
    setInput('');
    setApiError(null);
    setApiProvider(null);
    setIsEditMode(false);
  };
  
  // Gestion de l'envoi du message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Réinitialiser les erreurs API
    setApiError(null);
    setApiProvider(null);
    
    let currentConversationId = activeConversation;
    let currentMessages = [...messages];
    
    // Si nous ne sommes pas en mode édition ou si aucune conversation n'est active,
    // créer une nouvelle conversation
    if (!isEditMode || !activeConversation) {
      const newConversationId = generateId();
      const newConversation = {
        id: newConversationId,
        messages: [],
      };
      addConversation(newConversation);
      currentConversationId = newConversationId;
      currentMessages = [];
    }
    
    // Créer le message utilisateur
    const userMessage = createMessage('user', input);
    
    // Mettre à jour les messages
    const updatedMessages = [...currentMessages, userMessage];
    updateConversation(currentConversationId!, updatedMessages);
    
    // Réinitialiser l'input
    setInput('');
    setIsLoading(true);
    
    try {
      // Tenter de générer le code avec l'IA
      let generatedCode = "";
      let usedFallback = false;
      let provider = null;
      
      try {
        // Essayer d'utiliser l'API
        const result = await generateComponentCode(
          updatedMessages,
          componentType
        );
        
        if (typeof result === 'object' && 'code' in result) {
          generatedCode = result.code;
          provider = result.provider || 'api';
          setApiProvider(provider);
        } else {
          generatedCode = result;
          
          // Vérifier si la réponse contient une div d'erreur
          if (generatedCode.includes('class="p-4 bg-red-50') || 
              generatedCode.includes('class="p-4 my-4 bg-yellow-50') || 
              generatedCode.includes('Erreur lors de la génération')) {
            // Extraire le message d'erreur pour l'afficher
            const errorMatch = generatedCode.match(/<p [^>]*>(.*?)<\/p>/);
            if (errorMatch && errorMatch[1]) {
              setApiError(errorMatch[1]);
            } else {
              setApiError("Erreur de communication avec l'API");
            }
            
            // Si la réponse contient déjà un composant de démo, ne pas en générer un nouveau
            if (!generatedCode.includes('<!-- DEMO COMPONENT -->')) {
              // Utiliser le composant de démonstration comme fallback
              generatedCode = generateDemoComponent(componentType);
              usedFallback = true;
            } else {
              usedFallback = true;
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'appel à l'API:", error);
        setApiError("Erreur de communication avec l'API");
        
        // Utiliser le composant de démonstration comme fallback
        generatedCode = generateDemoComponent(componentType);
        usedFallback = true;
      }
      
      // Créer message assistant
      const assistantMessage = createMessage(
        'assistant',
        usedFallback 
          ? `J'ai rencontré un problème avec l'API, donc j'ai généré un composant de démonstration. Vous pouvez le modifier selon vos besoins.`
          : `J'ai généré le composant demandé${provider ? ` en utilisant ${provider}` : ''}. Vous pouvez le prévisualiser ci-dessous.`
      );
      
      // Mettre à jour les messages
      const finalMessages = [...updatedMessages, assistantMessage];
      
      // Si nous sommes en mode édition et qu'un componentId existe, mettre à jour ce composant
      if (isEditMode && componentId) {
        updateComponent(componentId, generatedCode);
        updateConversation(currentConversationId!, finalMessages, componentId);
      } else {
        // Sinon, créer un nouveau composant
        const newComponent = createComponent(
          componentType,
          generatedCode,
          website.components.length
        );
        addComponent(newComponent);
        
        // Mettre à jour la conversation avec l'ID du composant
        updateConversation(currentConversationId!, finalMessages, newComponent.id);
        setActiveComponent(newComponent.id);
        setIsEditMode(true); // Passer en mode édition après création
      }
      
      // Mettre à jour activeConversation
      setActiveConversation(currentConversationId);
      
    } catch (error) {
      console.error('Erreur globale:', error);
      
      // Message d'erreur
      const errorMessage = createMessage(
        'assistant',
        `Désolé, une erreur s'est produite lors de la génération du composant. Veuillez réessayer.`
      );
      
      updateConversation(currentConversationId!, [...updatedMessages, errorMessage]);
      setApiError("Erreur inattendue lors de la génération du composant");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">
            {isEditMode ? 'Modifier composant' : 'Nouveau composant'}
          </h2>
          {apiProvider && (
            <Badge variant="outline" className="ml-2">
              {apiProvider === 'groq' ? 'GROQ' : apiProvider === 'openai' ? 'OpenAI' : apiProvider}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewComponent}
            >
              Nouveau composant
            </Button>
          )}
          <select
            className="p-2 border rounded"
            value={componentType}
            onChange={(e) => setComponentType(e.target.value as WebsiteComponent['type'])}
            disabled={isLoading}
          >
            <option value="header">En-tête</option>
            <option value="hero">Bannière</option>
            <option value="section">Section</option>
            <option value="features">Fonctionnalités</option>
            <option value="testimonials">Témoignages</option>
            <option value="contact">Contact</option>
            <option value="footer">Pied de page</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>
      </div>
      
      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {apiError}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardContent className="p-4">
              <div className="font-medium mb-1">
                {message.role === 'user' ? 'Vous' : 'IA'}
              </div>
              <div className="text-sm text-gray-700">
                {message.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="flex items-start gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isEditMode 
              ? "Décrivez les modifications que vous souhaitez apporter..." 
              : "Décrivez ce que vous souhaitez pour votre composant..."}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Génération...' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </div>
  );
}