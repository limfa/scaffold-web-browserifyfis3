if(!window.console){
    window.console = {
        assert(){},
        clear(){},
        constructor(){},
        count(){},
        debug(){},
        dir(){},
        dirxml(){},
        error(e){setTimeout(()=>{throw e})},
        group(){},
        groupCollapsed(){},
        groupEnd(){},
        info(){},
        log(){},
        markTimeline(){},
        profile(){},
        profileEnd(){},
        table(){},
        time(){},
        timeEnd(){},
        timeStamp(){},
        timeline(){},
        timelineEnd(){},
        trace(){},
        warn(){},
    };
}
require('es5-shim');
// require('es5-shim/es5-sham');
