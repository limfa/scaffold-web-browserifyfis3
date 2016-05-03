'use strict';
/** slide 滚屏
 * @author  heyman
 * @datatime 15.05.19
 * @example
 * <div class="slide">
 *     <p class="item"></p>
 *     <p class="item"></p>
 *     <p class="item"></p>
 *     <div class="hand"></div>
 *     <div class="hand right"></div>
 *     <ul class="dotted">
 *         <li></li>
 *         <li></li>
 *         <li></li>
 *     </ul>
 * </div>
 */
void function(factory){
    if (typeof module === "object" && typeof module.exports === "object") {
        factory(require('jquery'));
    }else{
        factory(jQuery);
    }
}(function($) {
    var plus_name = 'slide';
    var $bd = $('body'),
    $win = $(window),
    fn = $.fn[plus_name] = function(opt) {
        // opt 为字符串时，进行插件操作，操作的方法为opt
        // 往后的参数将为方法的参数
        if (typeof opt == 'string') {
            var args = [].slice.call(arguments ,1),
                _opt = $.extend({}, fn.settings),
                result;
            this.each(function(i, el) {
                var data = new Kernel(el, _opt);
                result = data[opt].apply(data, args);
                // 如果有返回值，则退出
                if (result !== void 0) return false;
            });
            // 如果有返回值，则退出，并且返回值
            if (result !== void 0) return result;
            return this;
        } else {
            opt = $.extend({}, fn.settings, opt);
            return this.each(function(i, el) {
                new Kernel(el, opt);
            });
        }
    };

    // 默认配置
    fn.settings = {
        // 点亮类
        activeClass :'on' ,

        // 对象选择器
        item : '.ban-list > li',
        // 手
        hand_selector : '.ban-hand',
        // 右手
        hand_right : '.right',
        // 时间
        time : 500,

        // 起始
        startIndex : 0,

        // 点
        dotted : '.dots > span' ,

        // 自动播放 0为不自动
        auto : 4500,

        // 动作类型
        type : 'default' ,

        // 样式自动
        css : true,

        /* 自定义动作
        @arguments  now {index:当前序号 ,$target:目标$元素}  当前动作
        @arguments  last {index:当前序号 ,$target:目标$元素}  上次动作
        */
        actionFn : null, //function(now ,last){},

        // 动作方式
        actionType: {
            // 左右型
            'default' : function(now ,last){
                var self = this,
                opt = self.settings,
                active = opt.activeClass;
                var width = last.$target.outerWidth(true);
                last.$target.stop(true,true).animate({marginLeft:width*self.side,opacity:0},opt.time,function(){
                    $(this).hide().removeClass(active);
                });
                last.$dotted.removeClass(active);
                now.$target.stop(true,true)
                    .css({marginLeft:-width*self.side,opacity:0})
                    .show().animate({marginLeft:0,opacity:1} ,opt.time)
                    .add(now.$dotted).addClass(active);
            },
            // 上下型
            updown : function(now ,last){
                var self = this,
                opt = self.settings,
                active = opt.activeClass;
                var height = last.$target.outerHeight(true);
                last.$target.stop(true,true).animate({marginTop:height*self.side},opt.time,function(){
                    $(this).hide().removeClass(active);
                });
                last.$dotted.removeClass(active);
                now.$target.addClass(active).stop(true,true)
                    .css({marginTop:-height*self.side})
                    .show().animate({marginTop:0} ,opt.time)
                    .add(now.$dotted).addClass(active);
            }
        }
    };

    fn.constructor = Kernel;

    // 核心对象构造函数
    function Kernel(element, opt) {
        var $element = $(element),
            self = $element.data(plus_name);
        if (self) return self;

        self = this;
        self.$element = $element;
        // 操作对象保存到元素中
        $element.data(plus_name, self);

        self.settings = opt;

        // 获取元素本身配置
        for (var k in opt) {
            var v = $element.data(k);
            if(v !== void 0) opt[k] = v;
        }

        // 当前方向
        self.side = 0;
        // 点元素
        self.$dotted = $(opt.dotted ,$element);
        // 当前序号
        self.curIndex = opt.startIndex;
        // item子项
        self.$children = $(opt.item ,$element);
        // item子项 父元素
        self.$parent = self.$children.parent();
        // 手
        self.$handSelector = $(opt.hand_selector ,$element);

        self.init();
    }

    // 滚动第几章
    Kernel.prototype.step = function(index) {
        if(!index) return;
        var self = this,
        opt = self.settings,
        _index = self.curIndex,
        $children = self.$children,
        length = $children.length,
        $dotted = self.$dotted,
        args =[];

        self.side = index>0?-1:1;

        args[1] = {
            index:_index ,
            $target : $children.eq(_index),
            $dotted : $dotted.eq(_index)
        };
        self.curIndex = _index = ((_index + index)%length+length)%length;
        args[0] = {
            index : _index ,
            $target : $children.eq(_index),
            $dotted : $dotted.eq(_index)
        };

        if(opt.actionFn){
            opt.actionFn.apply(self ,args);
        }else{
            opt.actionType[opt.type].apply(self ,args);
        }
        // 触发事件
        self.$element.trigger(plus_name+'.step' ,args);
        
    };
    // 初始化
    Kernel.prototype.init = function() {
        var self = this,
        opt = self.settings,
        $parent = self.$parent,
        $children = self.$children,
        $element = self.$element;

        // 点亮
        $children.add(self.$dotted).removeClass(opt.activeClass);
        $children.eq(self.curIndex).add(self.$dotted.eq(self.curIndex)).addClass(opt.activeClass);

        // 样式自动
        if(+opt.css){
            // 孩子定位，父。。
            if($parent.css('position') != 'absolute') {
                $parent.css({
                    position : 'relative',
                    height : $parent.height() || 'auto',
                    width : $parent.width() || 'auto'
                });
            }
            $children.css({
                position : 'absolute' ,
                width : $children.width() || 'auto' ,
                height : $children.height() || 'auto'
            });
        }
        if( $children.length > 1 ){
            // 自动播放
            if(+opt.auto){
                var auto_timer,
                auto_fn = function(){
                    auto_timer =setInterval(function(){
                        if(self.$element.is(':visible')) self.step(1);
                    },opt.auto);
                };
                auto_fn();
                $element.hover(function(){
                    clearInterval(auto_timer);
                },function(){
                    clearInterval(auto_timer);
                    auto_fn();
                });
            }
            // 手按钮点击
            self.$handSelector.click(function(){
                self.step($(this).is(opt.hand_right)?1:-1);
            });
            // 点元素点击
            self.$dotted.click(function(){
                self.step($(this).index() - self.curIndex);
            });
        }else{
            self.$handSelector.hide();
            self.$dotted.hide();
        }
    };

});