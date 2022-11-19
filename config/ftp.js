const ftp = require('basic-ftp');
const loggingService = require('../service/logging');
const ftpService = require('../service/ftpSetting');
var fs = require('fs');
const logger = require('../config/logger');

async function getFtpData(ftpSettings) {
    await loggingService.saveAllLogger({id:ftpSettings.pk, stepId:'3', name:ftpSettings.BASE_FILE_NAME, process_id:ftpSettings.CFG_ID, description:`Start FTP(S) : FTP ID=${ftpSettings.FTP_ENV_ID}, FILE ID=${ftpSettings.pk}`});
    let returnData = await ftpService.getFtpList({id: ftpSettings.FTP_ENV_ID});

    if( returnData.length === 1 && returnData[0].TYPE && returnData[0].TYPE === 'FTP' ) {
        connectFtp(returnData[0], ftpSettings).then(()=>{
            loggingService.FinishAllLogger(ftpSettings.pk, ftpSettings.BASE_FILE_NAME, ftpSettings.fileMode && ftpSettings.fileMode === 'FTP'?'FTP SEND':'SUCCESS', ftpSettings.CFG_ID, 'FINISH JOB : ' + JSON.stringify(returnData));
        }).catch(err => {
            loggingService.FinishAllLogger(ftpSettings.pk, ftpSettings.BASE_FILE_NAME, ftpSettings.fileMode && ftpSettings.fileMode === 'FTP'?'FAILED FTP':'FAILED', ftpSettings.CFG_ID, 'FAILED JOB : ' + JSON.stringify(returnData) + ' / Error:'+ JSON.stringify(err));
        });
    } else if( returnData.length === 1 && returnData[0].TYPE && returnData[0].TYPE === 'SFTP' ) {
        connectSFtp(returnData[0], ftpSettings).then(()=>{
            loggingService.FinishAllLogger(ftpSettings.pk, ftpSettings.BASE_FILE_NAME, ftpSettings.fileMode && ftpSettings.fileMode === 'FTP'?'SFTP SEND':'SUCCESS', ftpSettings.CFG_ID, 'FINISH JOB : ' + JSON.stringify(returnData));
        }).catch(err => {
            loggingService.FinishAllLogger(ftpSettings.pk, ftpSettings.BASE_FILE_NAME, ftpSettings.fileMode && ftpSettings.fileMode === 'FTP'?'FAILED sFTP':'FAILED', ftpSettings.CFG_ID, 'FAILED JOB : ' + JSON.stringify(returnData) + ' / Error:'+ JSON.stringify(err));
        });
    }
}

async function connectFtp(ftpInfo, {FILE_TYPE, FILE_SAVE_FOLDER, FILE_NAME}) {
    const client = await new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: ftpInfo.FTP_ADDR,
            user: ftpInfo.USER_ID,
            password: ftpInfo.PWD,
            secure: false
        })
        await client.uploadFrom(FILE_SAVE_FOLDER + '/' + FILE_NAME + `.${FILE_TYPE}`, ftpInfo.BASE_DIR + '/' + FILE_NAME + `.${FILE_TYPE}`).then(()=>{
            fs.rename(FILE_SAVE_FOLDER + '/' + FILE_NAME + `.${FILE_TYPE}`, FILE_SAVE_FOLDER + '/BACKUP/' + FILE_NAME + `.${FILE_TYPE}`, function (err) {
                if (err) {
                    logger.error(err)
                    throw new Error(err);
                } else console.log('FILE Move Success!')
            });
        })

        // var files = fs.readdirSync(FILE_SAVE_FOLDER); // 디렉토리를 읽어온다

        // console.log(files);
        // for (var i = 0; i < files.length; i++) {
        //     var file = files[i];
        //     var suffix = file.substr(1, file.indexOf(ftpInfo.FILE_ALL, "*"));
        //     var suffix = file.split("*");
        //     if (suffix.length == 1)
        //     console.log(suffix);

        //     // 확장자가 json일 경우 읽어 내용 출력
        //     if (file.substr(1, suffix.length) === fs.FILE_NAME.substr(1, suffix.length)) {
        //         fs.readFile(FILE_SAVE_FOLDER + '/' + file, function (err, buf) {
        //             console.log(buf.toString());
        //         });
        //     }
        // }
    }
    catch(err) {
        logger.error(err)
    }
    client.close()
}

async function connectSFtp(ftpInfo, {FILE_TYPE, FILE_SAVE_FOLDER, FILE_NAME}) {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: ftpInfo.FTP_ADDR,
            user: ftpInfo.USER_ID,
            password: ftpInfo.PWD,
            secure: false
        })
        //fs.readdir(
        await client.uploadFrom(FILE_SAVE_FOLDER + '/' + FILE_NAME + `.${FILE_TYPE}`, ftpInfo.BASE_DIR + '/' + FILE_NAME + `.${FILE_TYPE}`).then(()=>{
            fs.rename(FILE_SAVE_FOLDER + '/' + FILE_NAME + `.${FILE_TYPE}`, FILE_SAVE_FOLDER + '/BACKUP/' + FILE_NAME + `.${FILE_TYPE}`, function (err) {
                if (err) {
                    logger.error(err)
                    throw new Error(err);
                } else console.log('FILE Move Success!')
            });
        })
        // await client.downloadTo(FILE_NAME, ftpInfo.BASE_DIR + '/' + FILE_NAME)
    }
    catch(err) {
        logger.error(err)
    }
    client.close()
}

module.exports = (ftpSettings) => {
    getFtpData(ftpSettings);
}