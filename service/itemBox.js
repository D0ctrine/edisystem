const connection = require('../db/main');
const logger = require('../config/logger');

/**
 * Get header and tail items
 * @param {id: job.id}
 */
async function getItemList (params) {
    return await connection.selectQuery(`
        SELECT * FROM (
            SELECT *
            FROM EDI_QUERY_SETTING
            WHERE 1=1
            AND SETTING_ID = (
                SELECT ID
                FROM CG_CUSTOMER 
                WHERE PARENT = (
                    SELECT ID
                    FROM CG_CUSTOMER 
                    WHERE ID=(
                        SELECT PARENT
                        FROM CG_CUSTOMER 
                        WHERE ID=(
                            SELECT PARENT 
                            FROM CG_CUSTOMER 
                            WHERE ID=:id
                        )
                    )
                )
                AND LOWER(NAME) = 'common'
            )
            AND TYPE IN ('DB','TEXT')
            AND KEY NOT IN (SELECT KEY
                            FROM EDI_QUERY_SETTING
                            WHERE 1=1
                            AND SETTING_ID = :id
                            AND TYPE IN ('DB','TEXT'))
            UNION ALL
            SELECT *
            FROM EDI_QUERY_SETTING
            WHERE 1=1
            AND SETTING_ID = :id
            AND TYPE IN ('DB','TEXT')
        )
        ORDER BY LENGTH(KEY) DESC
    `,params)
}

    module.exports = { getItemList }