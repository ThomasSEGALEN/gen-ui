import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWebsiteStore } from "@/store/websiteStore";
import { useEffect, useState } from "react";

export function ComponentEditor() {
	const [code, setCode] = useState("");
	const { website, activeComponent, updateComponent } = useWebsiteStore();

	const component = website.components.find((c) => c.id === activeComponent);

	useEffect(() => {
		if (component) {
			setCode(component.content);
		} else {
			setCode("");
		}
	}, [component]);

	const handleSave = () => {
		if (activeComponent) {
			updateComponent(activeComponent, code);
		}
	};

	if (!component) {
		return (
			<div className="h-full flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
				<p className="text-gray-500">
					Sélectionnez un composant pour le modifier.
				</p>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-lg font-medium">
					Éditeur:{" "}
					{component.type.charAt(0).toUpperCase() + component.type.slice(1)}
				</h2>
				<Button onClick={handleSave}>Enregistrer</Button>
			</div>

			<Textarea
				value={code}
				onChange={(e) => setCode(e.target.value)}
				className="flex-1 font-mono"
				placeholder="Le code HTML du composant s'affichera ici"
			/>
		</div>
	);
}
