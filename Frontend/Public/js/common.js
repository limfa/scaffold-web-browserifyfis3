const $ = window.$ = require('jquery');
require('./jquery.alert');
// --------------- shim --------------- 
if(!Array.prototype.find){
    Array.prototype.find = function(callback){
        for(let i = 0 ,l = this.length; i < l ;++i)
            if(callback.call(this ,this[i] ,i ,this)) return this[i];
        return ;
    };
}
// --------------- 全局函数 --------------- 
/**
 * 全局get，封装提示
 */
window.get = function(){
    return $.get.apply($ ,arguments).then(function(json){
        if(json.rtn!=0){
            if(!toLogin(json)){
                layer.msg(json.msg || '未知错误，错误码：' + json.msg);
                console.error(json.msg || '未知错误，错误码：' + json.msg);
            }
            return $.Deferred().reject(json);
        }
        return json;
    } ,function(response,text){
        if(text == 'abort'){}else{
            layer.msg('网络或服务器异常，请检验网络或联系管理员');
            console.error('网络或服务器异常，请检验网络或联系管理员');
        }
        return $.Deferred().reject(response);
    });
};
/**
 * 全局post，封装提示
 */
window.post = function(){
    return $.post.apply($ ,arguments).then(function(json){
        if(json.rtn!=0){
            if(!toLogin(json)){
                layer.msg(json.msg || '未知错误，错误码：' + json.msg);
                console.error(json.msg || '未知错误，错误码：' + json.msg);
            }
            return $.Deferred().reject(json);
        }
        return json;
    } ,function(response,text){
        if(text == 'abort'){}else{
            layer.msg('网络或服务器异常，请检验网络或联系管理员');
            console.error('网络或服务器异常，请检验网络或联系管理员');
        }
        return $.Deferred().reject(response);
    });
};
/**
 * 弹窗
 */
window.layer = {
    /**
     * 提示
     */
    msg(message ,options ,callback = $.noop){
        if($.isFunction(options)){
            callback = options;
            options = {};
        }else if(!options){
            options = {};
        }
        options = $.extend({
            classname: 'layer-msg',
            enterClass: 'anim-zoomIn',
            exitClass: 'anim-fadeOut',
            time: 2000,
            animationTime: 250,
        } ,options);
        // 初始化
        let $element;
        let selfData;
        if($.type(message) == 'string'){
            $element = $('<div></div>').html(message).addClass(options.classname);
        }else if(message && message.jquery){
            selfData = message.data('layer.msg');
            if(selfData && selfData.state == 'open') return;
            message.data('layer.msg' ,selfData = {state: 'open'});
            $element = message;
        }else{
            $.error('TypeError: message must string or jquery object');
        }
        $element.appendTo('body').show().css({
            position: 'fixed',
            left: '50%',
            top: '50%',
            marginLeft: -$element.outerWidth() / 2,
            marginTop: -$element.outerHeight() / 2,
            zIndex: 100000,
        });
        // 进入
        let hasOpend = false;
        let enterAnimationFunc = ()=>{
            if(hasOpend) return;
            hasOpend = true;
            $element.removeClass(options.enterClass);
        };
        $element.addClass(options.enterClass).one('animationend' ,enterAnimationFunc);
        setTimeout(enterAnimationFunc ,options.animationTime);
        // 关闭
        let hasClosed = false;
        let closeFunc = ()=>{
            if(hasClosed) return;
            hasClosed = true;
            let hasRemoved = false;
            let leaveAnimationFunc = ()=>{
                if(hasRemoved) return;
                hasRemoved = true;
                $element.removeClass(options.exitClass)[selfData?'detach':'remove']();
                if(selfData) selfData.state = 'hide';
                callback();
            }; 
            $element.addClass(options.exitClass).one('animationend' ,leaveAnimationFunc);
            setTimeout(leaveAnimationFunc ,options.animationTime);
        }
        if(options.time){
            setTimeout(closeFunc ,options.time);
        }
        $('html,body').one('mousedown' ,closeFunc);
    },
    // 显示图片
    showImage(url){
        let $img = $('<img/>');
        let $div = $('<div></div>');
        $div.append($img);
        $div.append('<a class="mask-close close" href="javascript:">×</a>');
        $img.attr('src' ,url);
        let img = new Image;
        img.onload = ()=>{
            $div.css({
                width: img.width,
                height: img.height,
            }).appendTo('body').one('alert.close' ,()=>{
                $img.remove();
            }).alert('open');
            
            $div.alert('$mask').one('click' ,()=>{
                $div.alert('close');
            });
        };
        img.onerror = ()=>{
            layer.msg('图片加载失败');
        };
        img.src = url;
    },
    loading(){
        let img = __uri('/Public/img/loading.gif');
        let $img = $('<img/>');
        $img.on('load' ,()=>{
            $img.css({
                width: $img[0].width,
                height: $img[0].height,
            }).appendTo('body').alert('open');
        });
        $img.attr('src' ,img);
        return ()=>$img.alert('close');
    },
};
/**
 * 获取URL search
 * @param  {String} name 
 */
window.getParam = function(name){
    var result = location.search.match(new RegExp('[?&]' + encodeURIComponent(name) + '=(.*?)(?:&|$)'));
    if(result && result[1]) return decodeURIComponent((result[1] + '')
        .replace(/%(?![\da-f]{2})/gi, function() {
          // PHP tolerates poorly formed escape sequences
          return '%25';
        })
        .replace(/\+/g, '%20'));
    return null;
};
/**
 * 根据forward重定向
 */
window.forward = function(){
    var forward = getParam('forward');
    location = forward? forward: '/';
};
/**
 * 跳转登录页
 */
window.toLogin = function(json){
    layer.msg('请先登录' ,()=>{
        location = ALLURL.login + '?forward=' + encodeURIComponent(location);
    });
};
/**
 * avalon 验证处理
 */
window.avalonValidFunc = function(vm ,key ,setKey){
    var result = true;
    // 加样式 设置errors
    var action = (name ,setKey)=>{
        vm.errors[name] = {[setKey]: 1};
        let classname = 'itxt-err';
        let $el = $(vm.$els[name]).focus().addClass(classname);
        let unwatch = vm.$watch(name ,()=>{
            unwatch();
            vm.errors[name] = {};
            $el.removeClass(classname);
            vm.$fire('errors');
        });
    };
    // 验证项处理
    var func = (name ,options)=>{
        var value = name.split('.').reduce((a,b)=>a[b] , vm);
        if(value === void 0) $.error('not should undefined: ' + name);
        var setKey;
        /*
         * 匹配规则
         * match 有此字段只匹配此结果
         * required 
         */
        if(options.match){
            if(!options.match(value)){
                setKey = 'match';
            }
        }else if(value){
            if(options.valid && !options.valid(value)){
                setKey = 'valid';
            }
        }else{
            if(options.required){
                setKey = 'required';
            }
        }
        if(setKey){
            action(name ,setKey);
            return result = false;
        }
        vm.errors[name] = {};
    }
    if(key){
        // 断定错误
        if(setKey) {
            action(key ,setKey);
            vm.$fire('errors');
            return ;
        }
        // 单个验证
        let [name ,options] = vm.validating.find(v=>v[0] == key);
        func(name ,options);
    }else{
        // 所有验证，遇到跳出
        $.each(vm.validating ,(i ,[name ,options])=>func(name ,options));
    }
    vm.$fire('errors');

    return result;
};
/********************************************************************************************************/
/********************************************************************************************************/
/********************************************************************************************************/
// ajax默认数据类型
$.ajaxSetup({dataType: 'json'});
// 防止重复ajax请求，基于jquery的请求
{
    let name = 'norepeatajax';
    let requestCache = {};
    let $self = $();
    $(document).ajaxSend(function(ev, xhr, args){
        let operaData = args[name] = {};//增加记录
        // $self.trigger('requestCallback' ,args.url);
        if(requestCache[args.url]){
            // $self.trigger('preventCallback' ,args.url);
            // 插件阻止记录
            operaData.prevent = true;
            // 已经请求了，取消掉
            xhr.abort();
        }else{
            requestCache[args.url] = true;
        }
    }).ajaxComplete(function(ev, xhr, args){
        if(xhr.readyState == 4 || (args[name] && !args[name].prevent)){
            // $self.trigger('completeCallback' ,args.url);
            delete requestCache[args.url];
        }
    });
};