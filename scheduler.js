const cron = require('node-cron');
const { resolve } = require('path');
const logger = require('./config/logger');

module.exports = {
    initCrons: (config) => {
        const today = new Date();   
        const curTime = {
            min: today.getMinutes(),
            hour: today.getHours(),
            date: today.getDate(),
            month: today.getMonth() + 1, // 0부터 1월 시작
            day: today.getDay()
        }

        config.forEach(async job => {
            if(job.fileMode || job.SEND_FLAG.toUpperCase() === 'Y') {
                let scheduleTime = await {
                    min: '$' + job.SCHEDULE_MIN.replace(/ /g,'$').replace(/,/g,'$') + '$',
                    hour: '$' + job.SCHEDULE_HOUR.replace(/ /g,'$').replace(/,/g,'$') + '$',
                    date: '$' + job.SCHEDULE_DAY.replace(/ /g,'$').replace(/,/g,'$') + '$',
                    month: '$' + job.SCHEDULE_MONTH.replace(/ /g,'$').replace(/,/g,'$') + '$',
                    day: '$' + job.SCHEDULE_WEEK.replace(/ /g,'$').replace(/,/g,'$') + '$'
                }
                // 실행할 시간인 경우
                if(job.fileMode || await scheduleRunFlag(curTime, scheduleTime)) {
                    logger.info(`Job Start Time > ${JSON.stringify(curTime)}\n ${JSON.stringify(job)}`)
                    try {
                        let handler = '';
                        if (job.DATA_TYPE === 'text') {
                            handler = require(resolve('handlers/out/makeFileText'));
                            handler(job);
                        } else if (job.DATA_TYPE === 'xml') {
                            handler = require(resolve('handlers/out/makeFileXml'));
                            handler(job);
                        } else if (job.DATA_TYPE === 'edifact' ) {
                            handler = require(resolve('handlers/out/makeFileEDIFact'));
                            handler(job);
                        } else  {
                            handler = require(resolve('handlers/out/makeFileNULL'));
                            handler(job);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        })
    }
}

async function scheduleRunFlag(curTime, {min, hour, date, month, day}) {
    if (min === '$*$' || min.indexOf('$' + curTime.min + '$') != -1) {} else return false
    if (hour === '$*$' || hour.indexOf('$' + curTime.hour + '$') != -1) {} else return false
    if (date === '$*$' || date.indexOf('$' + curTime.date + '$') != -1) {} else return false
    if (month === '$*$' || month.indexOf('$' + curTime.month + '$') != -1) {} else return false
    if (day === '$*$' || day.indexOf('$' + curTime.day + '$') != -1) {} else return false
    return true;
};