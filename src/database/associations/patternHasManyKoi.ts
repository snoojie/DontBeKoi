import { Koi } from "../models/koi";
import { Pattern } from "../models/pattern";

export default function associate()
{
    Pattern.hasMany(Koi, {
        sourceKey: "name",
        foreignKey: "patternName",
        as: "kois"
    });

    Koi.belongsTo(Pattern, {
        foreignKey: "patternName",
        targetKey: "name",
        as: "pattern"
    });
}