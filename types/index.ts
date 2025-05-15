export type WebsiteComponent = {
	id: string;
	type:
		| "header"
		| "section"
		| "footer"
		| "hero"
		| "features"
		| "testimonials"
		| "contact"
		| "custom";
	content: string;
	order: number;
	createdAt: Date;
	updatedAt: Date;
};

export type Website = {
	id: string;
	title: string;
	components: WebsiteComponent[];
	createdAt: Date;
	updatedAt: Date;
};

export type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: Date;
};

export type Conversation = {
	id: string;
	messages: Message[];
	componentId?: string;
};
