const config = require('./config');
const scheduler = require('./scheduler');
const cron = require('node-cron');
const { resolve } = require('app-root-path')
const express = require('express')
const in_folder = require('./in_folder');
const app = express()
const cors = require('cors')
const port = 3000
const chkNumber = /\d/
const handler = require(resolve('./handlers/out/makeFileText'));
// PM2 무중단 배포 및 데몬 실행 설정 블로그
// https://inpa.tistory.com/entry/node-%F0%9F%93%9A-PM2-%EB%AA%A8%EB%93%88-%EC%82%AC%EC%9A%A9%EB%B2%95-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EB%AC%B4%EC%A4%91%EB%8B%A8-%EC%84%9C%EB%B9%84%EC%8A%A4

const version_edicron = 'V2021.12.17.0'

app.use(cors());

let recentRunDate = null;

// 1분마다 설정해야될 정보 갱신 분이 바뀌기전 갱신
cron.schedule('*/30 * * * * *', () => {
    if (false && !isAlreadyRun(new Date(), recentRunDate)) {
        recentRunDate = new Date();
        config.saveAllLogger({id:"000", name:"CHECK", process_id:"000", result:'SUCCESS', description:version_edicron.toString()});
        config.SchedulerSetting().then((returnList)=>{
            cronDefineList = returnList;
            scheduler.initCrons(returnList);        
        }).catch(error => config.saveAllLogger({id:"000", name:"CHECK", process_id:"000", result:'ERROR', description:error.toString()}));
    }
    in_folder();
})

function isAlreadyRun(date, lastDate) {
    if (lastDate) {
        return (
        // (date.getSeconds() === lastDate.getSeconds())&&
        (date.getMinutes() === lastDate.getMinutes())&&
        (date.getHours() === lastDate.getHours())&&
        (date.getDate() === lastDate.getDate())&&
        (date.getMonth() === lastDate.getMonth())&&
        (date.getDay() === lastDate.getDay()));
    } else {
        return false;
    }
}


/**
 * 호출 시 Mode에 따른 데이터 생성
 * @param mode{FILE: '파일만 생성', FTP: '파일 생성 + FTP 전송', DATA: '데이터만 전송'}
 */
 app.get('/makeFile/:fileMode/:jobId', async (req, res) => {
    if(req.params.jobId && chkNumber.test(req.params.jobId)) {
      let job = await config.getOneJob(req.params.jobId);
      job.length > 0? job = job[0]:job;
      if (req.params.fileMode) {
          job.fileMode = req.params.fileMode;
      } else {
          job.fileMode = '';
      }
      if (job.fileMode === 'DATA') {
          let contents = await handler(job);
          res.status(200).send(contents);
      } else {
          await handler(job);
          res.status(200).send('OK');
      }
    }
  })
  
  app.listen(port, () => {
    console.log(`EDI DAEMON listening at Port:${port}`)
  })