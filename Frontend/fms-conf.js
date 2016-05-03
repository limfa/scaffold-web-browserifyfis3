var fms = require('fms');
fms.run();

fms.ajax({
    url: '/test/',
    type: 'get',
    res: {
        ok: {
            rtn: 0,
            info: {
                username: '发发',
            },
        },
        err: {
            rtn: 101,
        }
    }
});