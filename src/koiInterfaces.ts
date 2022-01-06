export enum Type {
    Progressive = "progressive",
    Collector = "collector"
}

export interface Color 
{
    name: string;
    hex: string;
}

export interface PatternAttributes
{
    name: string;
    hatchTime?: number | null;
    baseColors: Color[];
    commonColors: Color[];
    rareColors: Color[];
    type: Type;
}