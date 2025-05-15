"use client";

import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentEditor } from "@/components/website-builder/component-editor";
import { ComponentPreview } from "@/components/website-builder/component-preview";
import { Conversation } from "@/components/website-builder/conversation";
import { WebsitePreview } from "@/components/website-builder/website-preview";
import { useState } from "react";

export default function Home() {
	const [activeTab, setActiveTab] = useState("preview");

	return (
		<main className="flex flex-col h-screen">
			<header className="p-4 border-b">
				<h1 className="text-2xl font-bold">Website Builder IA</h1>
			</header>

			<div className="flex-1 overflow-hidden">
				<ResizablePanelGroup direction="horizontal">
					{/* Panneau de gauche - Conversation */}
					<ResizablePanel
						defaultSize={30}
						minSize={25}
					>
						<div className="h-full p-4">
							<Conversation />
						</div>
					</ResizablePanel>

					{/* Panneau central - Prévisualisation */}
					<ResizablePanel
						defaultSize={40}
						minSize={30}
					>
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="h-full flex flex-col"
						>
							<div className="border-b px-4">
								<TabsList className="mt-2">
									<TabsTrigger value="preview">Prévisualisation</TabsTrigger>
									<TabsTrigger value="code">Code</TabsTrigger>
								</TabsList>
							</div>

							<TabsContent
								value="preview"
								className="flex-1 p-4 overflow-auto"
							>
								<ComponentPreview />
							</TabsContent>

							<TabsContent
								value="code"
								className="flex-1 p-4 overflow-auto"
							>
								<ComponentEditor />
							</TabsContent>
						</Tabs>
					</ResizablePanel>

					{/* Panneau de droite - Structure du site */}
					<ResizablePanel
						defaultSize={30}
						minSize={25}
					>
						<div className="h-full p-4">
							<WebsitePreview />
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
		</main>
	);
}
