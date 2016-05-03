'use strict';
const fs = require('fs');
const path = require('path');
const mdeps = require('module-deps');
const Browserify = require('browserify');

// 处理目录
const SRC_DIR = path.join(__dirname ,'Public/page');
// 释放目录
const DIST_DIR = 'Public/dist';
// 处理文件 ,处理目录下所有文件 出去_开头的
const SRC_FILES = readFiles(SRC_DIR).filter(v=>!/^_/.test(path.basename(v)));
// 公共依赖最小次数
const DEPS_MIN = 10;
// 当前待处理文件
let CUR_FILE = process.argv.slice(2).map(v=>path.resolve(v));

log('开始-----------');
log('输入文件' ,CUR_FILE);

getDeps(SRC_FILES).then(result=>{

    log('文件依赖关系' ,result);

    // 获取公共项依赖关系
    // {path : {list: [] ,count: Number} ,...}
    let depsMap = {};
    result.forEach(v=>{
        for(let k in v.deps){
            let p = v.deps[k];
            if(p in depsMap){
                let fileO = depsMap[p];
                if(fileO.list.indexOf(k) == -1){
                    fileO.list.push(k);
                }
                ++fileO.count;
            }else{
                depsMap[p] = {list: [k] ,count: 1};
            }
        }
    });
    log('依赖的文件次数' ,depsMap);
    /*[ { file: 'E:\\xampp\\htdocs\\Learning\\browseify\\01-hello\\lib\\common.js',expose: '../lib/common' },
      { file: 'E:\\xampp\\htdocs\\Learning\\browseify\\01-hello\\lib\\log.js',expose: '../lib/log' } ]*/
    let _depsMap = [];
    for(let k in depsMap){
        if(depsMap[k].count >= DEPS_MIN){
            depsMap[k].list.forEach(v=>{
                _depsMap.push({
                    file: k,
                    expose: /^[.\/\\]/.test(v)? ('/' + path.relative(process.cwd(), k)) : v,
                });
            });
        }
    }
    log('合并的依赖文件' ,_depsMap);
    /*[ 'E:\\xampp\\htdocs\\Learning\\browseify\\01-hello\\lib\\common.js',
      'E:\\xampp\\htdocs\\Learning\\browseify\\01-hello\\lib\\log.js' ]*/   
    let depsList = [];
    for(let k in depsMap){
        if(depsMap[k].count >= DEPS_MIN){
            depsMap[k].list.forEach(v=>{
                depsList.push(/^[.\/\\]/.test(v)? k : v);  
            });
        }
    }
    // 当前待处理文件
    // 根据输入的文件找出被依赖的待处理的文件
    let _cur_file = [];
    let hasCommon = false;
    // 除去在公共依赖文件中的 文件或被依赖文件
    _depsMap.forEach(v=>{
        let i = CUR_FILE.indexOf(v.file);
        if(i != -1){
            // 文件已经在处理文件中
            CUR_FILE.splice(i ,1);
            hasCommon = true;
        }else{
            // 文件已经在处理文件的依赖中
            for(let k in v.deps){
                let p = v.deps[k];
                i = CUR_FILE.indexOf(p);
                if(i != -1){
                    CUR_FILE.splice(i ,1);
                    hasCommon = true;
                    break;
                }
            }
        }
    });
    let commonPath = path.join(DIST_DIR ,'common.js');
    if(hasCommon) CUR_FILE.push(commonPath);
    result.forEach(v=>{
        if(CUR_FILE.indexOf(v.file) != -1){
            // 文件已经在处理文件中
            _cur_file.push(v.file);
        }else{
            // 文件已经在处理文件的依赖中
            for(let k in v.deps){
                let p = v.deps[k];
                if(CUR_FILE.indexOf(p) != -1){
                    _cur_file.push(v.file);
                    break;
                }
            }
        }
    });
    CUR_FILE = CUR_FILE.concat(_cur_file).filter((v ,i ,arr)=>arr.lastIndexOf(v)==i); 
    log('当前待处理文件' ,CUR_FILE);

    // 公共依赖捆绑
    let p1 = new Promise(resolve=>{
        // 如果待处理文件没有在公共依赖的文件中则跳过
        if(hasCommon || CUR_FILE.length==0){
            let b = Browserify();
            mkFile(commonPath);
            b.transform("babelify", {presets: ["es2015"] }).require(_depsMap).bundle().pipe(fs.createWriteStream(commonPath)).on('close' ,()=>{
                resolve();
                log('文件完成 '+ commonPath);
            });
        }else{
            resolve();
            log('文件跳过 '+ commonPath);
        }
    });
    let filePathList = [];
    let p2 = result.map(v=>{
        return new Promise(resolve=>{
            let file = path.join(DIST_DIR ,path.relative(SRC_DIR ,v.file));
            // 如果待处理的文件不在，则跳过
            if(CUR_FILE.length && CUR_FILE.indexOf(v.file)==-1){
                resolve();
                log('文件跳过 '+file);
            }else{
                // 每个入口文件捆绑
                let b = Browserify(v.file);
                // 排除公共依赖
                b.external(depsList);
                filePathList.push(file);
                mkFile(file);
                b.transform("babelify", {presets: ["es2015"] }).bundle().pipe(fs.createWriteStream(file)).on('close' ,()=>{
                    resolve();
                    log('文件完成 '+file);
                });
            }
        });
    });
    p2.unshift(p1);
    filePathList.unshift(commonPath);
    return Promise.all(p2).then(()=>filePathList);
}).then(filePathList=>{
    log('全部完成-------------');
    console.log('success')
}).catch(dumpError);

/*[{
    file: 'E:\\xampp\\htdocs\\Learning\\browseify\\01-hello\\page\\page-add.js',
    deps: {
        '../lib/common': 'E:\\xampp\\htdocs\\Learning\\browseify\\01-hello\\lib\\common.js',
        '../lib/log': 'E:\\xampp\\htdocs\\Learning\\browseify\\01-hello\\lib\\log.js',
        '../lib/add': 'E:\\xampp\\htdocs\\Learning\\browseify\\01-hello\\lib\\add.js'
    }
}]*/
// 获取到依赖关系
function getDeps(ps){
    return Promise.all(ps.map(p=>new Promise(resolve=>{
        var md = mdeps({
            fileCache : false,
            cache: false
        });
        var data = [];
        md.on('data', function (file) {
            data.push(file);
        }).on('end' ,function(){
            data = data.filter(v=>v.entry).map(v=>({file: v.file ,deps: v.deps}));
            resolve(data[0]);
        });
        md.end({ file: p });
    }))).then(result=>{
        result = result.reduce((a ,b)=>a.concat(b) ,[]);
        return result
    });
}

// 读取所有文件 从目录中
function readFiles(dir){
    var files = fs.readdirSync(dir);
    var result = [];
    files.map(file=>{
        var fullFilePath = path.join(dir ,file);
        var stat = fs.statSync(fullFilePath);
        if(stat.isFile()){
            result.push(fullFilePath);
        }else if(stat.isDirectory()){
            result = result.concat(readFiles(fullFilePath));
        }
    });
    return result;
}

// 递归创建目录
function mkDir(_path){
    if(!fs.existsSync(_path)){
        var dirname = path.dirname(_path);
        mkDir(dirname);
        fs.mkdirSync(_path);
    }
}

// 递归创建文件 覆盖
function mkFile(_path ,content){
    var dirname = path.dirname(_path);
    mkDir(dirname);
    fs.writeFileSync(_path ,content || '');
}

// 打印错误
function dumpError(ex){
    process.stderr.write(ex.stack);
}

function log(text ,json){
    var content = '';
    var curTime = Date.now();
    if(!log.firstTime){
        content += '--------------------------------------------------------------------------\r\n';
        log.firstTime=log.lastTime=curTime;
        fs.writeFileSync('browserify-conf.js.log' ,'');
    }
    var sumTime = curTime - log.firstTime;
    var diffTime = curTime - log.lastTime;
    log.lastTime = curTime;
    content += new Date(curTime)+' | '+sumTime+' | '+diffTime+' | '+text+'\r\n';
    if(json) content += JSON.stringify(json ,null ,4) + '\r\n';
    fs.appendFileSync('browserify-conf.js.log' ,content);
}