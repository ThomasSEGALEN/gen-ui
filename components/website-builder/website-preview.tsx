import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWebsiteStore } from "@/store/websiteStore";
import { WebsiteComponent } from "@/types";
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

// Composant pour un élément triable
function SortableItem({ component }: { component: WebsiteComponent }) {
	const { removeComponent, setActiveComponent } = useWebsiteStore();
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: component.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className="border-2 mb-3"
		>
			<CardContent className="p-3">
				<div className="flex items-center justify-between">
					<div
						className="font-medium cursor-move"
						{...attributes}
						{...listeners}
					>
						{component.type.charAt(0).toUpperCase() + component.type.slice(1)}
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setActiveComponent(component.id)}
						>
							Modifier
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => removeComponent(component.id)}
						>
							Supprimer
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function WebsitePreview() {
	const { website, reorderComponents } = useWebsiteStore();
	const [exportStatus, setExportStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [exportError, setExportError] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = website.components.findIndex(
				(item) => item.id === active.id
			);
			const newIndex = website.components.findIndex(
				(item) => item.id === over.id
			);

			const newComponents = arrayMove(
				[...website.components],
				oldIndex,
				newIndex
			);

			reorderComponents(newComponents.map((item) => item.id));
		}
	};

	const handleExport = async () => {
		if (website.components.length === 0) {
			setExportStatus("error");
			setExportError(
				"Vous n'avez pas encore créé de composants pour votre site."
			);
			return;
		}

		setExportStatus("loading");
		setExportError(null);

		try {
			const response = await fetch("/api/save", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ website })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erreur lors de l'exportation");
			}

			const data = await response.json();

			// Créer un élément <a> pour télécharger le fichier
			const blob = new Blob([data.html], { type: "text/html" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "mon-site.html";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			setExportStatus("success");

			// Réinitialiser le statut après 3 secondes
			setTimeout(() => {
				setExportStatus("idle");
			}, 3000);
		} catch (error) {
			console.error("Erreur lors de l'exportation:", error);
			setExportStatus("error");
			setExportError(
				error instanceof Error ? error.message : "Erreur lors de l'exportation"
			);
		}
	};

	return (
		<div className="h-full flex flex-col">
			<h2 className="text-lg font-medium mb-2">Structure du site</h2>

			{exportStatus === "error" && (
				<Alert
					variant="destructive"
					className="mb-4"
				>
					<AlertDescription>
						{exportError || "Une erreur s'est produite lors de l'exportation"}
					</AlertDescription>
				</Alert>
			)}

			<div className="flex-1 overflow-y-auto">
				{website.components.length === 0 ? (
					<div className="h-32 flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
						<p className="text-gray-500">
							Votre site n&apos;a pas encore de composants. Utilisez la
							conversation avec l&apos;IA pour en créer.
						</p>
					</div>
				) : (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={website.components.map((c) => c.id)}
							strategy={verticalListSortingStrategy}
						>
							{website.components
								.sort((a, b) => a.order - b.order)
								.map((component) => (
									<SortableItem
										key={component.id}
										component={component}
									/>
								))}
						</SortableContext>
					</DndContext>
				)}
			</div>

			<div className="mt-4">
				<Button
					className="w-full"
					onClick={handleExport}
					disabled={
						exportStatus === "loading" || website.components.length === 0
					}
				>
					{exportStatus === "loading"
						? "Exportation en cours..."
						: exportStatus === "success"
							? "Exporté avec succès!"
							: "Exporter le site"}
				</Button>
			</div>
		</div>
	);
}
