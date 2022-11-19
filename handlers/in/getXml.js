const convert = require('xml-js');
const fs = require('fs');
const xmlService = require('../../service/in/receiveData');
let location = require('../../in_folder/folderLocation');
let today = '';
let now= '';

async function readXML(file) {
    location.FILE_NAME = await file;
    today = await getNow(false);
    now= await getNow();
    // 금일 폴더명 지정
    location.FAILURE = await location.FAILURE + '/'+today;
    location.COMPLETE = await location.COMPLETE + '/'+today;

    const xml = fs.readFileSync(`${location.RECEIVE}/${file}`, 'utf8');
    const options = {ignoreComment: true, compact: true, spaces: 4, alwaysChildren: true};
    const result = convert.xml2js(xml, options);
    const mesTxID = nullChecker(result.lotEvent.txDetails.txID); 
    await xmlService.xmlInsertDef({
        txID: mesTxID, txSourceUpdateTime: nullChecker(result.lotEvent.txDetails.txSourceUpdateTime)
        ,supplierName: nullChecker(result.lotEvent.txLotDetails.supplierName), lotName: nullChecker(result.lotEvent.txLotDetails.lotName)
        ,newLotName: nullChecker(result.lotEvent.txLotDetails.newLotName), mesLotName: nullChecker(result.lotEvent.txLotDetails.newLotName)
        ,fromStageSetName: nullChecker(result.lotEvent.txLotDetails.fromStageSetName), Operation: nullChecker(result.lotEvent.currentLotDetails.Operation)
        ,productName: nullChecker(result.lotEvent.txLotDetails.productName), goodQty1: nullChecker(result.lotEvent.currentLotDetails.goodQty1), goodQty2: nullChecker(result.lotEvent.currentLotDetails.goodQty2)
        ,rejectQty1: nullChecker(result.lotEvent.currentLotDetails.rejectQty1), locationName: nullChecker(result.lotEvent.txLotDetails.locationName)
    }).catch(() => fail());

    let sql = ''
    for(let i=0; i<result.lotEvent.currentLotItemsDetails.LotItem.length; i++) {
        let value = result.lotEvent.currentLotItemsDetails.LotItem[i]
        sql += await `INTO EDIXMLITEMS(MESTXID, SEQ, ITEMGROUP, GOODQTY, GENCHAR01, GENCHAR02, GENCHAR03, ITEMTYPE)
                VALUES (
                    '${mesTxID}', '${i}', '${nullChecker(value.itemGroup)}', '${nullChecker(value.goodQty)}', '${nullChecker(value.genChar01)}'
                  , '${nullChecker(value.genChar02)}', '${nullChecker(value.genChar03)}', '${nullChecker(value.itemType)}'
                  )`
    }

    // 최종 성공시
    await xmlService.xmlInsertItems(sql)
    .then(()=>complete())
    .catch(() => fail());

    
}

module.exports = async (file) => {
    await readXML(file);
};

function nullChecker(key) {
    if(!('_text' in key)) {
        return ''
    }
    if( key._text == undefined || key._text ==null) {
        return ''
    }
    return key._text
}

async function getNow(minFlag=true) {
    const date = await new Date();
    const min = await ("0" + date.getMinutes()).slice(-2);
    const hour= await ("0" + date.getHours()).slice(-2);
    const year = await date.getFullYear();
    const month = await ("0" + (1 + date.getMonth())).slice(-2);
    const day = await ("0" + date.getDate()).slice(-2);
    if(minFlag){
        return await (year + month + day + min + hour);
    }
    return await (year + month + day);
    
    
}

async function fail() {
    if (!fs.existsSync(location.FAILURE)) await fs.mkdirSync(location.FAILURE, { recursive: true });

    await fs.rename(location.RECEIVE + '/' + location.FILE_NAME, location.FAILURE + '/' + location.FILE_NAME+'_' + now, function (err) {
        if (err) {
            logger.error('[ File Error: '+location.FAILURE + '/' + location.FILE_NAME+'_' + now+'] '+err)
            throw new Error(err);
        } else console.log('FILE Move Success!')
    });
}

async function complete() {
    if (!fs.existsSync(location.COMPLETE)) await fs.mkdirSync(location.COMPLETE, { recursive: true });

    await fs.rename(location.RECEIVE + '/' + location.FILE_NAME, location.COMPLETE + '/' + location.FILE_NAME+'_' + now, function (err) {
        if (err) {
            logger.error('[ File Error: '+location.COMPLETE + '/' + location.FILE_NAME+'_' + now+'] '+err)
            throw new Error(err);
        } else console.log('FILE Move Success!')
    });
}