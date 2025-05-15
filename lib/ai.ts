import { generateDemoComponent } from "@/components/website-builder/demo-component";
import { Message } from "@/types";

// Fonction pour communiquer avec l'API de l'IA
export async function generateComponentCode(
	messages: Message[],
	componentType: string
): Promise<string | { code: string; provider: string }> {
	try {
		console.log("Préparation de la requête à l'API...", {
			messageCount: messages.length,
			componentType
		});

		// Validation des entrées
		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			console.log("Messages invalides - utilisation du mode démo");
			return generateDemoComponent(componentType);
		}

		if (!componentType) {
			console.log("Type de composant non spécifié - utilisation du mode démo");
			return generateDemoComponent("section");
		}

		// Construction de la requête
		const requestBody = JSON.stringify({
			messages,
			componentType
		});

		console.log("Envoi de la requête à l'API...");

		// Appel de l'API avec un timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout

		try {
			const response = await fetch("/api/ai", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: requestBody,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			console.log("Statut de réponse:", response.status);

			// Gestion des codes d'erreur HTTP
			if (!response.ok) {
				const errorData = await response.json();
				console.error("Détails de l'erreur API:", errorData);

				// Si l'API nous dit d'utiliser le mode démo (quota dépassé, etc.)
				if (errorData.useDemo || response.status === 429) {
					console.log("Utilisation du mode démo sur recommandation de l'API");
					return (
						generateQuotaErrorHTML(errorData.error || "Erreur API") +
						"<!-- DEMO COMPONENT -->\n" +
						generateDemoComponent(componentType)
					);
				}

				throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
			}

			// Récupération et validation des données
			const data = await response.json();

			if (!data) {
				throw new Error("Réponse invalide de l'API");
			}

			if (data.error) {
				if (data.useDemo) {
					console.log("Utilisation du mode démo sur recommandation de l'API");
					return (
						generateQuotaErrorHTML(data.error || "Erreur API") +
						"<!-- DEMO COMPONENT -->\n" +
						generateDemoComponent(componentType)
					);
				}

				throw new Error(data.error || "Erreur de l'API");
			}

			// Vérification si le code est présent dans la réponse
			if (!data.code) {
				throw new Error("La réponse de l'API ne contient pas de code");
			}

			// Si l'API a spécifié un fournisseur, le retourner
			if (data.provider) {
				return {
					code: data.code,
					provider: data.provider
				};
			}

			return data.code;
		} catch (error: any) {
			if (error.name === "AbortError") {
				throw new Error("La requête a pris trop de temps et a été annulée");
			}
			throw error;
		}
	} catch (error: any) {
		console.error("Erreur détaillée dans generateComponentCode:", error);

		// Créé un message d'erreur convivial avec détails techniques pour le débogage
		let errorMessage = "Erreur lors de la génération du code";
		let technicalDetails = error.message || "Erreur inconnue";

		if (
			error.message.includes("exceeded your current quota") ||
			error.message.includes("429")
		) {
			errorMessage = "Quota API dépassé";
			technicalDetails =
				"Vous avez dépassé votre quota d'utilisation de l'API. Vérifiez votre plan de facturation ou utilisez GROQ comme alternative.";

			return (
				generateQuotaErrorHTML(errorMessage, technicalDetails) +
				"<!-- DEMO COMPONENT -->\n" +
				generateDemoComponent(componentType)
			);
		} else if (error.message.includes("API key")) {
			errorMessage = "Problème avec la clé API";
			technicalDetails =
				"Vérifiez que la clé API est correctement configurée et valide";
		} else if (error.message.includes("401")) {
			errorMessage = "Authentification échouée";
			technicalDetails = "Votre clé API n'est pas valide ou a expiré.";
		} else if (
			error.message.includes("abort") ||
			error.message.includes("timeout")
		) {
			errorMessage = "La requête a pris trop de temps";
			technicalDetails =
				"La connexion à l'API a été interrompue en raison d'un délai d'attente.";
		} else if (
			error.message.includes("network") ||
			error.message.includes("fetch")
		) {
			errorMessage = "Problème de connexion réseau";
			technicalDetails =
				"Vérifiez votre connexion Internet et les paramètres du proxy si applicable.";
		}

		// Retourner un HTML avec message d'erreur pour l'affichage, suivi d'un composant de démo
		return `
<div class="p-4 my-4 bg-red-50 text-red-800 border border-red-200 rounded-lg shadow-sm">
  <h2 class="text-lg font-semibold mb-2">Erreur lors de la génération du composant</h2>
  <p class="mb-2">${errorMessage}</p>
  <details class="mt-2">
    <summary class="cursor-pointer text-sm text-red-600 hover:underline">Détails techniques pour le débogage</summary>
    <div class="mt-2 p-2 bg-red-100 text-red-700 rounded text-xs font-mono">
      ${technicalDetails}
    </div>
  </details>
  <p class="mt-4 text-sm">
    Vérifiez la configuration de l'API dans le 
    <a href="/config" class="text-blue-600 hover:underline">panneau de configuration</a>.
  </p>
</div>
<!-- DEMO COMPONENT -->
${generateDemoComponent(componentType)}`;
	}
}

// Fonction pour générer un message d'erreur de quota spécifique
function generateQuotaErrorHTML(
	errorMessage: string,
	details?: string
): string {
	return `
<div class="p-4 my-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg shadow-sm">
  <h2 class="text-lg font-semibold mb-2">Quota API dépassé</h2>
  <p class="mb-2">${errorMessage}</p>
  ${details ? `<p class="text-sm mb-2">${details}</p>` : ""}
  <p class="text-sm">
    <strong>Ce composant de démonstration est utilisé car le quota API est dépassé.</strong> 
    Options disponibles:
  </p>
  <ul class="list-disc ml-5 mt-2 text-sm">
    <li>Vérifier le plan de facturation de l'API utilisée</li>
    <li>Ajouter une méthode de paiement à votre compte</li>
    <li>Configurer une API alternative dans le <a href="/config" class="text-blue-600 hover:underline">panneau de configuration</a></li>
  </ul>
</div>`;
}
