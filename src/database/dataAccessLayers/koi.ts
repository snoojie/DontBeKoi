import { Sequelize } from "sequelize";
import { CommunitySpreadsheet, SpreadsheetKoi } from "../../google/communitySpreadsheet";
import RethrownError from "../../util/rethrownError";
import { initModel, Koi, KoiAttributes } from "../models/koi";

const KoiDal = {

    name: "Koi",
    
    /**
     * Initializes the Koi table.
     * @param sequelize Database connection
     * @throws if the Koi table could not be initialized.
     */
    init: async function(sequelize: Sequelize): Promise<void>
    {

        // initialize the model
        initModel(sequelize);

        // create the table if it doesn't exist yet
        try
        {
            await Koi.sync();
        }
        catch(error)
        {
            throw new RethrownError("Could not initialize the Koi table.", error);
        }

        const KOIS: SpreadsheetKoi[] = await CommunitySpreadsheet.getKois();
        let kois: KoiAttributes[] = [];
        for (const KOI of KOIS)
        {
            kois.push({
                name: KOI.name,
                rarity: KOI.rarity,
                pattern: KOI.pattern
            });
        }
        await Koi.bulkCreate(kois, { ignoreDuplicates: true });

    }
}

export default KoiDal;