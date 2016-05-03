setTimeout(()=>{
    alert('您当前的浏览器版本过低，可能存在安全风险，建议更换浏览器：');
    let n;
    do{
        n = prompt(`请选择需要的浏览器(输入序号)： 1.谷歌 chrome | 2.火狐 firefox | 3.360极速浏览器` ,'3');
        n = parseInt(n);
    }while(!(n >= 1 && n <=3));
    switch(n){
        case 1:
            location  = 'https://www.google.cn/intl/zh-CN/chrome/browser/desktop/';
            break;
        case 2:
            location  = 'https://www.mozilla.org/zh-CN/firefox/new/';
            break;
        case 3:
            location  = 'http://chrome.360.cn/';
            break;
    }
});