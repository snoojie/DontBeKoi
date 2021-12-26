import { Client } from "discord.js";

export abstract class ClientEvent 
{
    public readonly name: string;
	public readonly listener: Listener;

	constructor(name: string, listener?: Listener)
	{
		this.name = name;
		this.listener = listener ? listener : Listener.ON;
	}

	public start(client: Client): void
	{
		client[this.listener](this.name, (...args) => this.execute(...args));
	}

	public abstract execute(...args: any[]): Promise<void>;
}

export const enum Listener {
	ONCE = "once",
	ON   = "on"
};