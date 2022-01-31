import { Koi } from "../models/koi";
import { Pattern } from "../models/pattern";

export default function associate()
{
    Pattern.hasMany(Koi, {
        sourceKey: "name",
        foreignKey: "pattern",
        as: "kois"
    });
}