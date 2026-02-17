import type { Vector3 } from "@types";

export interface BedwarsCoreConfiguration {
	generators: Generator[];
	currencies: Currency[];
	shops: Shop[];
}

export interface Generator {
	item: string;
	position: Vector3;
	delaySeconds: number;
}

export interface Currency {
	id: string;
	name: string;
	color: string;
}

export interface Shop {
	items: ShopItem[];
	name: string;
	shopkeepers: Shopkeeper[];
}

export interface Item {
	id: string;
	count: number;
}
export interface ShopItem extends Item {
	name: string;
	Slot: number;
	price: Item;
}

export interface Shopkeeper {
	position: Vector3;
}
