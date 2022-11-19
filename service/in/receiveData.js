const connection = require('../../db/main');
const logger = require('../../config/logger');


/**
 * Read Xml and insert Table EDIXMLDEF
 * SCHEDUING_AGREEMENT, SCHEDUING_AGREEMENT_LINEITEM: FG Shipment만 해당
 * @param {id: job.id}
 */

async function xmlInsertDef (params) {
    return await connection.insertSQL(`
    INSERT INTO EDIXMLDEF(MESTXID, TXSOURCE_UPDATETIME, SUPPLIER_LOTNAME, IFXLOTNAME, NEWLOTNAME, MESLOTNAME, STAGES_IDENTIFIER, OPERATION, PRODUCTNAME, GOODWFEQTY, GOODLOTQTY, REJECTWAFERQTY, LOCATION, SCHEDUING_AGREEMENT, SCHEDUING_AGREEMENT_LINEITEM)
    VALUES (:txID, :txSourceUpdateTime, :supplierName, :lotName, :newLotName, :mesLotName, :fromStageSetName, :Operation, :productName, :goodQty1, :goodQty2, :rejectQty1, :locationName, '', '')
    `,params)
}
 
/**
 * Read Xml and insert Table EDIXMLITEMS
 * SCHEDUING_AGREEMENT, SCHEDUING_AGREEMENT_LINEITEM: FG Shipment만 해당
 * @param {id: job.id}
 */
 async function xmlInsertItems (sql) {
    return await connection.insertSQL(`
    INSERT ALL 
    ${sql}
    SELECT * FROM DUAL
    `)
}

    module.exports = {xmlInsertDef, xmlInsertItems};