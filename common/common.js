exports.PRIVACY_TEAM = 1;
exports.PRIVACY_PERSONAL = 2;
exports.PRIVACY_PUBLIC = 3;

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

exports.humanDate = function(time) {
    var nowDate = new Date();
    var now = nowDate.getTime();
    var delta = time - now;
    var d = new Date(parseInt(time) || time);
    if(delta < 24 * 3600 * 1000 && d.getDay() == nowDate.getDay()) {
        return d.format('h点m分');
    } else if(delta < 366 * 24 * 3600 * 1000 && d.getYear() == nowDate.getYear()) {
        return d.format('M月d日');
    }
    return d.format('yy年MM月dd日');
}

exports.htmlTxtP = function (txt) {
  return txt.replace(/ /g, '&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '</p><p>');
}

exports.htmlTxt = function (txt) {
  return txt.replace(/ /g, '&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

