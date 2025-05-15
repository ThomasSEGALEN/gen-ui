import { Card } from "@/components/ui/card";
import { useWebsiteStore } from "@/store/websiteStore";

export function ComponentPreview() {
	const { website, activeComponent } = useWebsiteStore();

	const component = website.components.find((c) => c.id === activeComponent);

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
				Prévisualisation:{" "}
				{component.type.charAt(0).toUpperCase() + component.type.slice(1)}
			</h2>

			<Card className="flex-1 overflow-hidden">
				<div
					className="w-full h-full overflow-y-auto p-4"
					dangerouslySetInnerHTML={{ __html: component.content }}
				/>
			</Card>
		</div>
	);
}
