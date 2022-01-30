import { Sequelize } from "sequelize";
import { CommunitySpreadsheet } from "../../google/communitySpreadsheet";
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

        // create the table if they don't exist yet
        try
        {
            await Koi.sync();
        }
        catch(error)
        {
            throw new RethrownError("Could not initialize the Koi table.", error);
        }

        const PROGRESSIVES = await CommunitySpreadsheet.getProgressives();
        let kois: KoiAttributes[] = [];
        for (const PROGRESSIVE of PROGRESSIVES)
        {
            for (const KOI of PROGRESSIVE.kois)
            {
                kois.push({
                    name: KOI.name,
                    rarity: KOI.rarity
                });
            }
        }
        await Koi.bulkCreate(kois, { ignoreDuplicates: true });

    }
}

export default KoiDal;