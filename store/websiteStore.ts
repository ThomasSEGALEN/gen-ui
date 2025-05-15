import { Conversation, Message, Website, WebsiteComponent } from "@/types";
import { create } from "zustand";

interface WebsiteState {
	website: Website;
	conversations: Conversation[];
	activeConversation: string | null;
	activeComponent: string | null;
	setWebsite: (website: Website) => void;
	addComponent: (component: WebsiteComponent) => void;
	updateComponent: (id: string, content: string) => void;
	removeComponent: (id: string) => void;
	reorderComponents: (componentIds: string[]) => void;
	setActiveComponent: (id: string | null) => void;
	addConversation: (conversation: Conversation) => void;
	updateConversation: (
		id: string,
		messages: Message[],
		componentId?: string
	) => void;
	setActiveConversation: (id: string | null) => void;
}

export const useWebsiteStore = create<WebsiteState>((set) => ({
	website: {
		id: "",
		title: "Mon nouveau site",
		components: [],
		createdAt: new Date(),
		updatedAt: new Date()
	},
	conversations: [],
	activeConversation: null,
	activeComponent: null,

	setWebsite: (website) => set({ website }),

	addComponent: (component) =>
		set((state) => ({
			website: {
				...state.website,
				components: [...state.website.components, component],
				updatedAt: new Date()
			}
		})),

	updateComponent: (id, content) =>
		set((state) => ({
			website: {
				...state.website,
				components: state.website.components.map((component) =>
					component.id === id
						? { ...component, content, updatedAt: new Date() }
						: component
				),
				updatedAt: new Date()
			}
		})),

	removeComponent: (id) =>
		set((state) => ({
			website: {
				...state.website,
				components: state.website.components.filter(
					(component) => component.id !== id
				),
				updatedAt: new Date()
			}
		})),

	reorderComponents: (componentIds) =>
		set((state) => ({
			website: {
				...state.website,
				components: state.website.components
					.map((component) => ({
						...component,
						order: componentIds.indexOf(component.id)
					}))
					.sort((a, b) => a.order - b.order),
				updatedAt: new Date()
			}
		})),

	setActiveComponent: (id) => set({ activeComponent: id }),

	addConversation: (conversation) =>
		set((state) => ({
			conversations: [...state.conversations, conversation],
			activeConversation: conversation.id
		})),

	updateConversation: (id, messages, componentId) =>
		set((state) => ({
			conversations: state.conversations.map((conversation) =>
				conversation.id === id
					? {
							...conversation,
							messages,
							componentId: componentId || conversation.componentId
						}
					: conversation
			)
		})),

	setActiveConversation: (id) => set({ activeConversation: id })
}));
