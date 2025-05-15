import { Website } from "@/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { website } = (await request.json()) as { website: Website };

		// Génération du HTML complet
		const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${website.title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        ${website.components
					.sort((a, b) => a.order - b.order)
					.map((component) => component.content)
					.join("\n")}
      </body>
      </html>
    `;

		// Dans un vrai projet, vous sauvegarderiez ce HTML dans une base de données
		// ou un système de fichiers en utilisant un service comme AWS S3, etc.
		// Pour cet exemple, nous allons simplement retourner le HTML

		return NextResponse.json({
			success: true,
			html,
			message: "Site exporté avec succès"
		});
	} catch (error) {
		console.error("Erreur sauvegarde:", error);
		return NextResponse.json(
			{ error: "Erreur lors de l'exportation du site" },
			{ status: 500 }
		);
	}
}
