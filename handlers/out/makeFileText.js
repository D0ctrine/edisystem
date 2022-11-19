var fs = require('fs');
const logger = require('../../config/logger');
const mainQueryService = require('../../service/mainQuery');
const itemQueryService = require('../../service/itemBox');
const envQueryService = require('../../service/envSetting');
const headTailService = require('../../service/headerTail');
const loggingService = require('../../service/logging');

async function contentsGet(job) {
    // Main Query 여러개 중에 가장 최근 데이터 가져오기
    // logger.info('<< Get Main Query >>\n' + getMainQuery.replace(':id',job.CFG_ID));
  let queryData = job.CFG_ID ? await mainQueryService.getMainQuery({id: job.CFG_ID}):'';

  // Binding 해야될 변수 가져오기 ( Common과 File_Define )
  // logger.info('<< Get Items >>\n' + itemQuery.replace(':id',job.CFG_ID));
  let params = job.CFG_ID ? await itemQueryService.getItemList({id: job.CFG_ID}):'';
  if (params.length > 0 && queryData.length > 0 && queryData[0].QUERY) {
    for await (const param of params) {
        if(queryData[0].QUERY.indexOf(':' + param.KEY)!==-1 || job.FILE_NAME.indexOf(':' + param.KEY)!==-1){
            let returnQuery = '';
            if (param.TYPE === 'DB') {
                let contentsDB = await getDB(DB_TYPE=param.DBTYPE);
                returnQuery = await contentsDB.selectQuery(param.QUERY,{});
                param.QUERY = await returnQuery.length>0?returnQuery[0].VALUE.toString():'';
                param.TYPE = 'TEXT';
            } 
            queryData[0].QUERY = await queryData[0].QUERY.replace(new RegExp(':' + param.KEY, 'g'), param.QUERY)
            
            job.FILE_ALL = await job.FILE_NAME.replace(new RegExp(':' + param.KEY, 'g'), '*')
            job.FILE_NAME = await job.FILE_NAME.replace(new RegExp(':' + param.KEY, 'g'), param.QUERY)
        }
    }
  }
  let contentsData = ''
  if (job.CFG_ID && queryData.length > 0) {
    let contentsDB = await getDB(DB_TYPE=queryData[0].DBTYPE);
    await loggingService.startQueryLogger({id: job.pk, name: job.FILE_NAME, process_id:job.CFG_ID, sql: queryData[0].QUERY});
    contentsData = await contentsDB.selectQuery(queryData[0].QUERY, {}, true); //본문 가져오기
    await loggingService.FinishQueryLogger({id: job.pk, row_count:contentsData.length, result:'SUCCESS'});
  }
  return {data: contentsData, items: params};
}

async function makeFileText(job) {
    logger.info(`${job.ID} >>> makeFileText Function Execute`);
    job.BASE_FILE_NAME = await job.FILE_NAME;
    let log = await loggingService.saveAllLogger({id:'seq', stepId:'1', name:job.BASE_FILE_NAME, process_id:job.CFG_ID, description:`Job Start : ID=${job.ID}, CFG_ID=${job.CFG_ID}, FTP_ENV_ID=${job.FTP_ENV_ID}, FILE_NAME=${job.FILE_NAME}, FILE_DESC=${job.FILE_DESC}, FILE_CHARSET=${job.FILE_CHARSET}, FILE_TYPE=${job.FILE_TYPE}`});
    job.pk = await log;
    let returnList = await contentsGet(job);
    // 본문
    let returnData = returnList.data;
    // Parameter List
    let itemList = returnList.items;
    let contents = '';
    
    let saveDirectory = await job.FILE_SAVE_FOLDER; // 파일 저장 위치
    if (!fs.existsSync(saveDirectory)) await fs.mkdirSync(saveDirectory, { recursive: true }); // 디렉토리 확인 후 없다면 생성

    // env 값가져오기
    let envSettings = await envQueryService.getEnvList({id: job.CFG_ID});

    // Header&Tail
    let HeadernTail = await headTailService.getHeadTailList({id: job.CFG_ID});

    if (itemList.length > 0 && HeadernTail.length > 0) {
        for (const headntail of HeadernTail) {
            for (const param of itemList) {
                if(headntail.VALUE.indexOf(':' + param.KEY)!==-1){
                    if (param.TYPE === 'DB') {
                        let contentsDB = await getDB(DB_TYPE=param.DBTYPE);
                        let returnQuery = await contentsDB.selectQuery(param.QUERY,{});
                        param.QUERY = await returnQuery.length>0?returnQuery[0].VALUE.toString():'';
                        param.TYPE = 'TEXT';
                    } 
                    headntail.VALUE = await headntail.VALUE.replace(new RegExp(':' + param.KEY, 'g'), param.QUERY)
                }
            }
        }
      }
    // 본문에 Header 값 채우기
    let Settings = await getDB(DB_TYPE='MAIN');
    for (const item of HeadernTail) {
        if (item.DATA_TYPE && item.DATA_TYPE.startsWith('h')) {
            if (item.DATA_TYPE.indexOf('sql') !== -1) {
                item.VALUE = await Settings.selectQuery(item.VALUE).then((returnValue)=>{
                    return returnValue.length > 0 ? returnValue[0].VALUE + '\r\n':''
                });
                contents += item.VALUE
            } else {
                contents += item.VALUE + '\r\n'
            }
        } 
    }
    for (const item of returnData) {
        let start = ''
        let end = ''
        let between = ''
        if (envSettings && envSettings.length>0) {
            start = await envSettings.find(element => element.ITEM==='start');
            end = await envSettings.find(element => element.ITEM==='end');
            between = await envSettings.find(element => element.ITEM==='between');
            start= await { VALUE: start && 'VALUE' in start ? (start.VALUE? start.VALUE:''):'' }
            between= await { VALUE: between && 'VALUE' in between ? (between.VALUE?between.VALUE:''):''}
            end= await { VALUE: end && 'VALUE' in end ? (end.VALUE?end.VALUE:''):'' }
        }
        contents += start.VALUE + Object.values(item).reduce((a,b)=>a + between.VALUE + b) + end.VALUE
        contents += '\r\n'
    }

    // 본문에 Tail 값 채우기
    for (const item of HeadernTail) {
        if (item.DATA_TYPE && item.DATA_TYPE.startsWith('t')) {
            if (item.DATA_TYPE.indexOf('sql') !== -1) {
                item.VALUE = await Settings.selectQuery(item.VALUE).then((returndata)=>{
                    return returndata.length > 0 ? returndata[0].VALUE + '\r\n':''
                });
                contents += item.VALUE
            } else {
                contents += item.VALUE + '\r\n'
            }
        } 
    }
    if (job.fileMode && job.fileMode === 'DATA') {
        await loggingService.FinishAllLogger(job.pk, job.BASE_FILE_NAME, 'DATA SEND', job.CFG_ID, 'Web Request');
        return contents;
    }
    // encoding :  "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "base64url" | "latin1" | "binary" | "hex"
    await fs.writeFile(saveDirectory + '/' + job.FILE_NAME + '.' + job.FILE_TYPE, contents, job.FILE_CHARSET, async function (err) {
        if (err) {
            await loggingService.FinishAllLogger(job.pk, job.BASE_FILE_NAME, 'FAILED', job.CFG_ID, 'Make File Failed - ' + err).then(()=>{
                throw new Error(err);
            });
        } else {
            await loggingService.saveAllLogger({id:job.pk, stepId:'2', name:job.BASE_FILE_NAME, process_id:job.CFG_ID, description:'Make File : File Save Directory: '+saveDirectory + '/' + job.FILE_NAME + '.' + job.FILE_TYPE});
        }
    });
    if (!(returnData.length === 0 && job.NODATASEND === 'true')) {
        if (job.fileMode && job.fileMode === 'FTP') {
            let ftp = await require('../config/ftp');
            ftp(job);
        } else if (job.fileMode === 'FILE') {
            await loggingService.FinishAllLogger(job.pk, job.BASE_FILE_NAME, 'MAKE FILE', job.CFG_ID, 'Web Request');
        } else {
            let ftp = await require('../config/ftp');
            ftp(job);
        }
    }
}

module.exports = async (job) => {
    return await makeFileText(job);
};

async function getDB(DB_TYPE) {
    let connection = await '';
if (DB_TYPE && DB_TYPE ==='MAIN') {
    connection = await require('../db/main')
    } else if (DB_TYPE && DB_TYPE ==='MES') {
    connection = await require('../db/mes')
    } else if (DB_TYPE && DB_TYPE ==='REPORT') {
    connection = await require('../db/report')
    } else {
    return await false;
    }
    return await connection;
}