const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');
const JavaScriptObfuscator = require('javascript-obfuscator');
let buildConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './build-js-config.json')));

const argv = process.argv;
const PID = process.pid;

let argIndex = 2;

const CUSTOM_HOST = argv[argIndex] || buildConfig.CUSTOM_HOST || 'www.qiushaocloud.top';
const CUSTOM_SECRET_KEY = argv[++argIndex] || buildConfig.CUSTOM_SECRET_KEY || 'QIU_SHAO_CLOUD_SECRET_KEY';

const addChatCodeNum = 43893;
const secretKeyCharCodeArr = [];

for (const key in CUSTOM_SECRET_KEY) {
  secretKeyCharCodeArr.push(CUSTOM_SECRET_KEY[key].charCodeAt() + addChatCodeNum);
}

const SECRET_KEY_CHAR_CODE_STR = secretKeyCharCodeArr.join('-');

console.log(
  '请运行命令: node build-js.js 或者 node build-js.js $CUSTOM_HOST $CUSTOM_SECRET_KEY',
  '\n$CUSTOM_HOST: 您 web 界面请求服务器的地址, 默认值: www.qiushaocloud.top【格式如：www.qiushaocloud.top 或者 https://www.qiushaocloud.top:443】',
  '\n$CUSTOM_SECRET_KEY: 您 web 界面请求服务器接口的签名 secretKey, 默认值: QIU_SHAO_CLOUD_SECRET_KEY',
  '\n可以从 build-js-config.json 配置 CUSTOM_HOST CUSTOM_SECRET_KEY'
);

console.log(
  'PID:',PID,
  ' ,argv:', argv
);

console.log(
  '\nCUSTOM_HOST:', CUSTOM_HOST,
  '\nCUSTOM_SECRET_KEY:', CUSTOM_SECRET_KEY,
  '\nSECRET_KEY_CHAR_CODE_STR:', SECRET_KEY_CHAR_CODE_STR,
  '\n'
);

fs.readFile(
  path.join(__dirname, './qiushaocloud_site_counter.js'),
  'utf8',
  (readErr, data) => {
    if (readErr) {
      console.error('readFile err:', readErr);
      return;
    }

    let fileContent = data;
    fileContent = fileContent.replace(/var CUSTOM_HOST = .*;/g, `var CUSTOM_HOST = '${CUSTOM_HOST}';`);
    fileContent = fileContent.replace(/var SECRET_KEY_CHAR_CODE_STR = .*;/g, `var SECRET_KEY_CHAR_CODE_STR = '${SECRET_KEY_CHAR_CODE_STR}';`);
    
    const uglifyOpts = {};
    const uglifyResult = UglifyJS.minify(fileContent, uglifyOpts);
    let minFileContent = uglifyResult.code;

    const obfuscationResult = JavaScriptObfuscator.obfuscate(
      minFileContent,
      {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        numbersToExpressions: true,
        simplify: true,
        stringArrayShuffle: true,
        splitStrings: true,
        stringArrayThreshold: 1
      }
    );

    minFileContent = obfuscationResult.getObfuscatedCode();
    // console.log(minFileContent);

    fs.writeFile(
      path.join(__dirname, './qiushaocloud_site_counter.js'),
      fileContent,
      'utf8',
      (writeErr) => {
      if (writeErr) {
        console.error('writeFile fileContent err:', writeErr);
        return;
      }

      console.log('writeFile fileContent done');
    });

    fs.writeFile(
      path.join(__dirname, './qiushaocloud_site_counter.min.js'),
      minFileContent,
      'utf8',
      (writeErr) => {
      if (writeErr) {
        console.error('writeFile minFileContent err:', writeErr);
        return;
      }

      console.log('writeFile minFileContent done');
    });
  });