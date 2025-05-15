import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateDemoComponent } from "@/components/website-builder/demo-component";
import { generateComponentCode } from "@/lib/ai";
import { createComponent, createMessage, generateId } from "@/lib/utils";
import { useWebsiteStore } from "@/store/websiteStore";
import { WebsiteComponent } from "@/types";
import React, { useState } from "react";

export function Conversation() {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);
	const [apiProvider, setApiProvider] = useState<string | null>(null);
	const [componentType, setComponentType] =
		useState<WebsiteComponent["type"]>("section");

	const {
		conversations,
		activeConversation,
		website,
		addComponent,
		updateComponent,
		addConversation,
		updateConversation,
		setActiveComponent
	} = useWebsiteStore();

	const conversation = conversations.find((c) => c.id === activeConversation);
	const messages = conversation?.messages || [];
	const componentId = conversation?.componentId;

	// Gestion de l'envoi du message
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!input.trim() || isLoading) return;

		// Réinitialiser les erreurs API
		setApiError(null);
		setApiProvider(null);

		// Si pas de conversation active, en créer une nouvelle
		if (!activeConversation) {
			const newConversation = {
				id: generateId(),
				messages: []
			};
			addConversation(newConversation);
		}

		// Créer le message utilisateur
		const userMessage = createMessage("user", input);

		// Mettre à jour les messages
		const updatedMessages = [...messages, userMessage];
		updateConversation(activeConversation!, updatedMessages);

		// Réinitialiser l'input
		setInput("");
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

				if (typeof result === "object" && "code" in result) {
					generatedCode = result.code;
					provider = result.provider || "api";
					setApiProvider(provider);
				} else {
					// ici result est garantie d'être une string
					generatedCode = result;

					// Vérifier si la réponse contient une div d'erreur (notre format de message d'erreur)
					if (
						generatedCode.includes('class="p-4 bg-red-50') ||
						generatedCode.includes('class="p-4 my-4 bg-yellow-50') ||
						generatedCode.includes("Erreur lors de la génération")
					) {
						// Extraire le message d'erreur pour l'afficher
						const errorMatch = generatedCode.match(/<p [^>]*>(.*?)<\/p>/);
						if (errorMatch && errorMatch[1]) {
							setApiError(errorMatch[1]);
						} else {
							setApiError("Erreur de communication avec l'API");
						}

						// Si la réponse contient déjà un composant de démo, ne pas en générer un nouveau
						if (!generatedCode.includes("<!-- DEMO COMPONENT -->")) {
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
				"assistant",
				usedFallback
					? `J'ai rencontré un problème avec l'API, donc j'ai généré un composant de démonstration. Vous pouvez le modifier selon vos besoins.`
					: `J'ai généré le composant demandé${provider ? ` en utilisant ${provider}` : ""}. Vous pouvez le prévisualiser ci-dessous.`
			);

			// Mettre à jour les messages
			const finalMessages = [...updatedMessages, assistantMessage];
			updateConversation(activeConversation!, finalMessages);

			// Si un composant existe déjà, le mettre à jour, sinon en créer un nouveau
			if (componentId) {
				updateComponent(componentId, generatedCode);
			} else {
				const newComponent = createComponent(
					componentType,
					generatedCode,
					website.components.length
				);
				addComponent(newComponent);

				// Mettre à jour la conversation avec l'ID du composant
				updateConversation(activeConversation!, finalMessages, newComponent.id);
				setActiveComponent(newComponent.id);
			}
		} catch (error) {
			console.error("Erreur globale:", error);

			// Message d'erreur
			const errorMessage = createMessage(
				"assistant",
				`Désolé, une erreur s'est produite lors de la génération du composant. Veuillez réessayer.`
			);

			updateConversation(activeConversation!, [
				...updatedMessages,
				errorMessage
			]);
			setApiError("Erreur inattendue lors de la génération du composant");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center gap-2 mb-4">
				<h2 className="text-lg font-medium">Conversation avec l&apos;IA</h2>
				{apiProvider && (
					<Badge
						variant="outline"
						className="ml-2"
					>
						{apiProvider === "groq"
							? "GROQ"
							: apiProvider === "openai"
								? "OpenAI"
								: apiProvider}
					</Badge>
				)}
				<div className="flex-1"></div>
				<select
					className="p-2 border rounded"
					value={componentType}
					onChange={(e) =>
						setComponentType(e.target.value as WebsiteComponent["type"])
					}
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

			{apiError && (
				<Alert
					variant="destructive"
					className="mb-4"
				>
					<AlertDescription>
						{apiError}
						<div className="mt-2 text-sm">
							<a
								href="/config"
								className="underline"
							>
								Vérifier la configuration
							</a>
						</div>
					</AlertDescription>
				</Alert>
			)}

			<div className="flex-1 overflow-y-auto mb-4 space-y-4">
				{messages.map((message) => (
					<Card key={message.id}>
						<CardContent className="p-4">
							<div className="font-medium mb-1">
								{message.role === "user" ? "Vous" : "IA"}
							</div>
							<div className="text-sm text-gray-700">{message.content}</div>
						</CardContent>
					</Card>
				))}
			</div>

			<form
				onSubmit={handleSubmit}
				className="mt-auto"
			>
				<div className="flex items-start gap-2">
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Décrivez ce que vous souhaitez pour votre composant..."
						className="flex-1"
						disabled={isLoading}
					/>
					<Button
						type="submit"
						disabled={isLoading}
					>
						{isLoading ? "Génération..." : "Envoyer"}
					</Button>
				</div>
			</form>
		</div>
	);
}
