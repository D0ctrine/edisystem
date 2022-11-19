const fs = require('fs');
const getXml = require('../handlers/in/getXml');

const location = require('./folderLocation')

const file_format = {
    XML: (file) => getXml(file)
}

function fileCheck() {
    let files = fs.readdirSync(location.RECEIVE);
    for(const file of files) {
        if(file.indexOf('.')!=-1 && file.substring(file.lastIndexOf('.')+1).toUpperCase() in file_format) file_format[file.substring(file.lastIndexOf('.')+1).toUpperCase()](file)
    }
}

async function folderCheck() {
    if (!fs.existsSync(location.HOME)) await fs.mkdirSync(location.HOME, { recursive: true });
    if (!fs.existsSync(location.RECEIVE)) await fs.mkdirSync(location.RECEIVE, { recursive: true });
    if (!fs.existsSync(location.COMPLETE)) await fs.mkdirSync(location.COMPLETE, { recursive: true });
    if (!fs.existsSync(location.FAILURE)) await fs.mkdirSync(location.FAILURE, { recursive: true });
    console.log('folderCheck Complete')
}

module.exports = async () => {
    console.log('folderCheck')
    await folderCheck();
    console.log('fileCheck')
    await fileCheck();
};