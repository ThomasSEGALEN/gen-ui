// Fonction pour générer un composant de démonstration sans utiliser l'API
export function generateDemoComponent(type: string): string {
	const demoComment = `<!-- DEMO COMPONENT - Type: ${type} -->\n`;

	let htmlCode = "";

	switch (type) {
		case "header":
			htmlCode = `
<header class="bg-white shadow">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <span class="text-indigo-600 font-bold text-xl">LOGO</span>
      </div>
      <nav class="hidden md:flex space-x-10">
        <a href="#" class="text-gray-500 hover:text-gray-900">Accueil</a>
        <a href="#" class="text-gray-500 hover:text-gray-900">Produits</a>
        <a href="#" class="text-gray-500 hover:text-gray-900">Services</a>
        <a href="#" class="text-gray-500 hover:text-gray-900">À propos</a>
        <a href="#" class="text-gray-500 hover:text-gray-900">Contact</a>
      </nav>
      <div>
        <button class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          Commencer
        </button>
      </div>
    </div>
  </div>
</header>`;
			break;

		// Autres cases inchangés...

		case "custom":
		default:
			htmlCode = `
<div class="py-8 px-4 bg-white">
  <div class="max-w-7xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">Composant personnalisé</h2>
    <p class="text-gray-600">
      Ceci est un composant personnalisé que vous pouvez modifier selon vos besoins.
      Vous pouvez changer le texte, ajouter des images, modifier les couleurs, etc.
    </p>
    <div class="mt-6 p-4 bg-gray-100 rounded-lg">
      <p class="text-gray-800">
        Utilisez l'éditeur de code pour personnaliser ce composant en utilisant HTML et les classes Tailwind CSS.
      </p>
    </div>
  </div>
</div>`;
			break;
	}

	return demoComment + htmlCode;
}
