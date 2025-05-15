import { Message } from "@/types";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
	try {
		// Parsing du corps de la requête
		let body;
		try {
			body = await request.json();
		} catch (error) {
			console.error("Erreur de parsing JSON:", error);
			return NextResponse.json(
				{ error: "Requête invalide: impossible de parser le JSON" },
				{ status: 400 }
			);
		}

		// Validation des données requises
		if (!body || !body.messages || !body.componentType) {
			console.error("Données manquantes:", body);
			return NextResponse.json(
				{ error: "Messages ou type de composant manquants" },
				{ status: 400 }
			);
		}

		const { messages, componentType } = body;

		// Construction du prompt pour l'IA
		const prompt = `
      Tu es un expert en développement web spécialisé dans la création de composants web avec Tailwind CSS.
      L'utilisateur demande de générer un composant de type "${componentType}" pour son site web.
      
      Génère uniquement le code HTML avec des classes Tailwind CSS pour ce composant.
      Ne pas inclure de balises React, JavaScript, ou script.
      
      Le code doit être propre, responsive et moderne.
      
      Réponds uniquement avec le code HTML et CSS Tailwind, sans aucune explication.
    `;

		// Formatage des messages pour l'API
		const formattedMessages = [
			{
				role: "system",
				content: prompt
			},
			...messages.map((message: Message) => ({
				role: message.role,
				content: message.content
			}))
		];

		// Essayer d'abord GROQ si une clé est disponible
		if (process.env.GROQ_API_KEY) {
			try {
				console.log("Envoi de la requête à GROQ...");

				const groq = new Groq({
					apiKey: process.env.GROQ_API_KEY
				});

				const response = await groq.chat.completions.create({
					model: "llama3-8b-8192", // Modèle GROQ équivalent
					messages: formattedMessages,
					temperature: 0.7,
					max_tokens: 2000
				});

				console.log("Réponse reçue de GROQ");

				if (
					!response.choices ||
					!response.choices[0] ||
					!response.choices[0].message
				) {
					throw new Error("Réponse GROQ invalide");
				}

				const generatedContent = response.choices[0].message.content || "";

				// Extraction du code HTML de la réponse
				const codeRegex = /```(?:html)?\s*([\s\S]*?)```/;
				const match = generatedContent.match(codeRegex);
				const code = match ? match[1].trim() : generatedContent;

				return NextResponse.json({
					code,
					provider: "groq"
				});
			} catch (error) {
				if (error instanceof Error) {
					console.error("Erreur GROQ:", error.message);
				} else {
					console.error("Erreur GROQ:", "Erreur inconnue");
				}
				// Si GROQ échoue, on passera à OpenAI ou au mode de secours
			}
		}

		// Si GROQ a échoué ou n'est pas configuré, essayer OpenAI
		if (process.env.OPENAI_API_KEY) {
			try {
				console.log("Envoi de la requête à OpenAI...");

				const openai = new OpenAI({
					apiKey: process.env.OPENAI_API_KEY
				});

				const response = await openai.chat.completions.create({
					model: "gpt-3.5-turbo",
					messages: formattedMessages,
					temperature: 0.7,
					max_tokens: 2000
				});

				console.log("Réponse reçue d'OpenAI");

				if (
					!response.choices ||
					!response.choices[0] ||
					!response.choices[0].message
				) {
					throw new Error("Réponse OpenAI invalide");
				}

				const generatedContent = response.choices[0].message.content || "";

				// Extraction du code HTML de la réponse
				const codeRegex = /```(?:html)?\s*([\s\S]*?)```/;
				const match = generatedContent.match(codeRegex);
				const code = match ? match[1].trim() : generatedContent;

				return NextResponse.json({
					code,
					provider: "openai"
				});
			} catch (error) {
				if (error instanceof Error) {
					console.error("Erreur OpenAI:", error.message);

					// Si c'est une erreur de quota, propager spécifiquement cette erreur
					if (
						error.message.includes("429") ||
						error.message.includes("exceeded your current quota")
					) {
						return NextResponse.json(
							{
								error: "Quota API OpenAI dépassé",
								details:
									"Vous avez dépassé votre quota d'utilisation de l'API OpenAI.",
								useDemo: true
							},
							{ status: 429 }
						);
					}
				} else {
					console.error("Erreur OpenAI:", "Erreur inconnue");
				}
			}
		}

		// Si on arrive ici, c'est que les deux services ont échoué ou ne sont pas configurés
		const configErrorMessage =
			!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY
				? "Aucune clé API configurée (ni GROQ, ni OpenAI)"
				: "Toutes les API ont échoué";

		return NextResponse.json(
			{
				error: configErrorMessage,
				details: "Veuillez configurer au moins une clé API valide.",
				useDemo: true
			},
			{ status: 500 }
		);
	} catch (error) {
		if (error instanceof Error) {
			// Log détaillé de l'erreur
			console.error("ERREUR API IA DÉTAILLÉE:", error.name, error.message);

			return NextResponse.json(
				{
					error: "Erreur lors de la communication avec l'IA",
					details: error.message,
					useDemo: true
				},
				{ status: 500 }
			);
		} else {
			return NextResponse.json(
				{
					error: "Erreur inconnue lors de la communication avec l'IA",
					details: "Une erreur inconnue s'est produite.",
					useDemo: true
				},
				{ status: 500 }
			);
		}
	}
}
