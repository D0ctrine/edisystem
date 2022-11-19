//문자코드를 모를경우 jschardet 모듈로 확인하여 문자코드 변경하기 입니다.

var fs          = require('fs');
var Iconv       = require('iconv').Iconv;
var jschardet   = require('jschardet');

// 뮨자코드를 모르는 파일 불러오기
var content = fs.readFileSync('text_unknown.txt');

// 문자코드 확인
var content2 = jschardet.detect(content);
console.log(content2);

// Iconv 로 utf-8 로 변환하는 객체 생성
var iconv = new Iconv(content2.encoding, "utf-8");
var content3 = iconv.convert(content); // UTF-8 로 변환
var utf8Text = content3.toString('utf-8'); // 버퍼를 문자열로 변환 
console.log(utf8Text);