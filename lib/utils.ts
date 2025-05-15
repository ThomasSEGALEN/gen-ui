import { Message, WebsiteComponent } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

// Fonction pour fusionner les classes Tailwind
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Fonction pour générer un ID unique
export function generateId(): string {
	return uuidv4();
}

// Fonction pour créer un nouveau composant de site
export function createComponent(
	type: WebsiteComponent["type"],
	content: string,
	order: number
): WebsiteComponent {
	return {
		id: generateId(),
		type,
		content,
		order,
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

// Fonction pour créer un nouveau message
export function createMessage(role: Message["role"], content: string): Message {
	return {
		id: generateId(),
		role,
		content,
		createdAt: new Date()
	};
}
