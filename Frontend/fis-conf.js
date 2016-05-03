var child_process = require('child_process');
var path = require('path');

fis.match('*.{css,js,png,jpg,gif}', {
  // useHash: true
});

fis.match('*' ,{
    release: false
});
fis.match('Public/**' ,{
    release: ''
});
var timer;
var fileList = [];
fis.match('Public/{js,page}/**.js' ,{
    // hack 
    // 文件修改时调用 node browserify-conf.js
    parser: function(content, file, settings){
        clearTimeout(timer);
        fileList.push(file.origin);
        timer = setTimeout(function(){
            console.log(fileList.map(v=>path.relative(__dirname ,v)));
            var args = ['browserify-conf.js'];
            args = args.concat(fileList);
            var p = child_process.spawn('node' ,args);
            p.on('close' ,function(code){
                if(code === 0){
                }else{
                    process.stderr.write(code);
                }
            });
            p.stdout.on('data' ,function(data){
                process.stderr.write(data);
            });
            p.stderr.on('data' ,function(data){
                process.stderr.write(data);
            });
            timer = null;
            fileList = [];
        } ,20);
        
        return '';
    },
    release: '',
});
fis.match('Public/dist/**.js' ,{
    // 处理 default关键字
    // 可能会有bug
    parser: function(content){
        return content.replace(/([\{,]\s*)default(\s*:)/g ,"$1'default'$2").replace(/(\w+)\.default\b/g ,"$1['default']");
    },
});

fis.media('pub').match('**.js', {
    // 处理 default关键字
    // 可能会有bug
    parser: function(content){
        return content.replace(/([\{,]\s*)default(\s*:)/g ,"$1'default'$2").replace(/(\w+)\.default\b/g ,"$1['default']");
    },
    // fis-optimizer-uglify-js 插件进行压缩，已内置
    optimizer: fis.plugin('uglify-js')
});
fis.media('pub').match('**.css', {
    // fis-optimizer-clean-css 插件进行压缩，已内置
    optimizer: fis.plugin('clean-css')
});
fis.media('pub').match('**.png', {
    // fis-optimizer-png-compressor 插件进行压缩，已内置
    optimizer: fis.plugin('png-compressor')
});
fis.media('pub').match('Public/{js,page}/**.js' ,{
    parser: function(content){return content}
});

// fis.match('::packager', {
//   postpackager: fis.plugin('loader', {
//     //allInOne: true
//   })
// });

// fis.match('*.{css,less}', {
//   packTo: '/static/aio.css'
// });
