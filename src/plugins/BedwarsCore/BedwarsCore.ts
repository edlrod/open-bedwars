import * as fs from "node:fs";
import { getPosition, log, secondsToTicks, snbt } from "@utils";
import BedwarsPlugin from "../../BedwarsPlugin";
import type {
	BedwarsCoreConfiguration,
	Currency,
	Generator,
	Shop,
	ShopItem,
} from "./types";

export default class BedwarsCore extends BedwarsPlugin {
	private currencies: Record<string, Currency> = {};
	private generators: Generator[] = [];
	private shops: Shop[] = [];
	private purchasableItems: ShopItem[] = [];
	public configure(configuration: BedwarsCoreConfiguration): void {
		this.currencies = configuration.currencies.reduce(
			(acc, currency) => {
				acc[currency.id] = currency;
				return acc;
			},
			{} as Record<string, Currency>,
		);
		this.generators = configuration.generators;
		this.shops = configuration.shops;
		this.purchasableItems = this.shops.flatMap((shop) => shop.items);
	}

	public onBuild(datapackPath: string): boolean {
		try {
			const currencyScoreboard = `${this.namespace}_currency`;

			fs.writeFileSync(
				`${datapackPath}/data/${this.namespace}/function/purchase.mcfunction`,
				[
					`$execute store result score @s ${currencyScoreboard} if items entity @s container.* $(price_id)`,
					`$execute if score @s ${currencyScoreboard} matches $(price_count).. run give @s $(reward_id) $(reward_count)`,
					`$execute if score @s ${currencyScoreboard} matches $(price_count).. run tellraw @s {"text":"Purchased $(reward_count) $(reward_name)!","color":"green"}`,
					`$execute unless score @s ${currencyScoreboard} matches $(price_count).. run tellraw @s {"text":"Not enough $(price_name)!","color":"red"}`,
					`$execute if score @s ${currencyScoreboard} matches $(price_count).. run clear @s $(price_id) $(price_count)`,
				].join("\n"),
			);
			log("Wrote purchase.mcfunction", "✏️");
			return true;
		} catch {
			return false;
		}
	}

	public onLoad(): string[] {
		let shopkeeperIndex = -1;
		return [
			`scoreboard objectives add ${this.namespace}_generators dummy`,
			`scoreboard objectives add ${this.namespace}_currency dummy`,
			...this.generators.flatMap((_, i) => [
				`scoreboard players set ${i} ${this.namespace}_generators 0`,
			]),
			...this.shops.flatMap((shop) =>
				shop.shopkeepers.flatMap((sk) => {
					shopkeeperIndex += 1;
					return [
						`summon villager ${getPosition(sk.position)} {Tags:["${this.namespace}","${this.namespace}_shopkeeper"],NoAI:1b,Silent:1b,Invulnerable:1b}`,
						`summon item_display ${sk.position.x} ${sk.position.y + 1} ${sk.position.z} {Tags:["${this.namespace}"],Passengers:[{id:"minecraft:chest_minecart",Tags:["${this.namespace}", "${this.namespace}_shop", "${this.namespace}_shop_${shopkeeperIndex}"],Passengers:[{id:marker,Tags:[${this.namespace}]}],Silent:1b,Invulnerable:1b,CustomName:'${shop?.name ?? "Shop"}',DisplayState:{Name:"minecraft:barrier"}}]}`,
					];
				}),
			),
			...Object.entries(this.shops).flatMap(([shopId, shop]) => [
				`data modify storage ${this.namespace}:shops ${shopId} set value ${snbt(
					shop.items.map((item) => ({
						...item,
						components: {
							custom_data: {
								[`${this.namespace}_shop_item`]: 1,
							},
							Tags: [`${this.namespace}`],
							item_name: { bold: true, text: item.name },
							lore: [
								{
									text: `${item.price?.count} ${this.currencies[item.price?.id ?? ""]?.name || item.price?.id}`,
									italic: false,
									color:
										this.currencies[item.price?.id ?? ""]?.color || "white",
								},
							],
						},
					})),
				)}`,
			]),
		];
	}
	public onUnload(): string[] {
		return [
			`scoreboard objectives remove ${this.namespace}_generators`,
			`scoreboard objectives remove ${this.namespace}_currency`,
		];
	}
	public onTick(): string[] {
		return [
			...this.generators.flatMap((g, i) => [
				`# Generators`,
				`scoreboard players add ${i} ${this.namespace}_generators 1`,
				`execute if score ${i} ${
					this.namespace
				}_generators matches ${secondsToTicks(
					g.delaySeconds,
				)}.. run summon item ${getPosition(g.position)} {Tags:["${this.namespace}"],Item:{id:"${g.item}"}}`,
				`execute if score ${i} ${
					this.namespace
				}_generators matches ${secondsToTicks(
					g.delaySeconds,
				)}.. run scoreboard players reset ${i} ${this.namespace}_generators`,
				`# Shopkeepers`,
				`execute as @e[tag=${this.namespace}_shopkeeper] at @s run tp @s ~ ~ ~ facing entity @p`,
				`# Set shops`,
				...Object.entries(this.shops).flatMap(([shopId, _], shopIndex) => [
					`execute as @e[tag=${this.namespace}_shop_${shopIndex}] run data modify entity @s Items set from storage ${this.namespace}:shops ${shopId}`,
				]),
				`# Check for Purchases`,
				...this.purchasableItems.flatMap((item) => [
					`execute as @a if items entity @s player.cursor ${item.id}[count=${item.count},custom_data={${this.namespace}_shop_item:1b}] run function ${this.namespace}:purchase {reward_id: "${item.id}", reward_count: ${item.count}, reward_name: "${item.name}", price_id: "${item.price?.id}", price_count: ${item.price?.count}, price_name: "${this.currencies[item.price?.id ?? ""]?.name || item.price?.id}"}`,
					`execute as @a if items entity @s container.* ${item.id}[count=${item.count},custom_data={${this.namespace}_shop_item:1b}] run function ${this.namespace}:purchase {reward_id: "${item.id}", reward_count: ${item.count}, reward_name: "${item.name}", price_id: "${item.price?.id}", price_count: ${item.price?.count}, price_name: "${this.currencies[item.price?.id ?? ""]?.name || item.price?.id}"}`,
				]),
				`execute as @a run clear @s *[custom_data={${this.namespace}_shop_item: 1b}]`,
			]),
		];
	}
}
